// @vitest-environment node
import {
  ClientToServerEvents,
  JoinResult,
  ServerToClientEvents,
} from '@multiplayer/protocol/events';
import { AddressInfo } from 'node:net';
import { createServer } from 'node:http';
import { Socket, io as connect } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createSocketServer } from './sockets.ts';

type ClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let httpServer: ReturnType<typeof createServer>;
let ioServer: ReturnType<typeof createSocketServer>;
let port: number;
const openSockets: ClientSocket[] = [];

const connectClient = async () => {
  const socket: ClientSocket = connect(`http://localhost:${port}`, {
    transports: ['websocket'],
  });
  openSockets.push(socket);
  await new Promise<void>((resolve) => socket.on('connect', () => resolve()));
  return socket;
};

/** resolves on the next occurrence of an event, or rejects if it never lands */
const nextEvent = <Event extends keyof ServerToClientEvents>(
  socket: ClientSocket,
  event: Event,
  timeoutMs = 500,
) =>
  new Promise<Parameters<ServerToClientEvents[Event]>[0]>(
    (resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`timed out waiting for ${String(event)}`)),
        timeoutMs,
      );
      socket.once(event as any, (payload: any) => {
        clearTimeout(timer);
        resolve(payload);
      });
    },
  );

/** asserts an event does NOT arrive, which is how privilege denials are observed */
const expectNoEvent = async <Event extends keyof ServerToClientEvents>(
  socket: ClientSocket,
  event: Event,
  windowMs = 250,
) => {
  let seen = false;
  socket.once(event as any, () => {
    seen = true;
  });
  await new Promise((resolve) => setTimeout(resolve, windowMs));
  expect(seen).toBe(false);
};

const startRoom = (socket: ClientSocket) =>
  new Promise<{ roomId: string; userId: string }>((resolve) => {
    socket.emit(
      'startRoom',
      {
        displayName: 'Professor',
        productId: 'traversals',
        state: { core: { nodes: { a: { x: 0 } } } },
      },
      (roomId, userId) => resolve({ roomId, userId }),
    );
  });

const joinRoom = (socket: ClientSocket, roomId: string) =>
  new Promise<JoinResult>((resolve) => {
    socket.emit(
      'joinRoom',
      { roomId, displayName: 'Student', productId: 'traversals' },
      resolve,
    );
  });

beforeEach(async () => {
  httpServer = createServer();
  ioServer = createSocketServer(httpServer, { corsOrigins: ['*'] });
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  port = (httpServer.address() as AddressInfo).port;
});

afterEach(async () => {
  for (const socket of openSockets) socket.disconnect();
  openSockets.length = 0;
  ioServer.close();
  await new Promise<void>((resolve) => {
    httpServer.close(() => resolve());
  });
});

describe('room lifecycle', () => {
  it('hands a joiner the host seeded server state', async () => {
    const host = await connectClient();
    const { roomId } = await startRoom(host);

    const student = await connectClient();
    const result = await joinRoom(student, roomId);

    expect(result.joined).toBe(true);
    if (!result.joined) return;
    expect(result.serverState?.state).toEqual({ core: { nodes: { a: { x: 0 } } } });
    expect(result.serverState?.version).toBe(1);
    expect(result.serverState?.stateHash).toEqual(expect.any(String));
  });

  it('treats a dead room id as a non event rather than an error', async () => {
    const student = await connectClient();
    const result = await joinRoom(student, 'does-not-exist');

    expect(result).toEqual({ joined: false });
  });

  it('disbands the room when the host disconnects', async () => {
    const host = await connectClient();
    const { roomId } = await startRoom(host);
    const student = await connectClient();
    await joinRoom(student, roomId);

    const disbanded = nextEvent(student, 'roomDisbanded');
    host.disconnect();
    await expect(disbanded).resolves.toBeUndefined();
  });

  it('does not disband when a non host disconnects', async () => {
    const host = await connectClient();
    const { roomId } = await startRoom(host);
    const student = await connectClient();
    await joinRoom(student, roomId);

    const stillAlive = expectNoEvent(host, 'roomDisbanded');
    student.disconnect();
    await stillAlive;
  });
});

describe('product layer privilege', () => {
  it('drops patches from a read tier joiner', async () => {
    const host = await connectClient();
    const { roomId } = await startRoom(host);
    const student = await connectClient();
    await joinRoom(student, roomId);

    const noRelay = expectNoEvent(host, 'serverStatePatched');
    student.emit('patchServerState', {
      payloadId: 'payload-1',
      productId: 'traversals',
      ops: [{ op: 'add', path: '/core/nodes/b', value: { x: 9 } }],
    });
    await noRelay;
  });

  it('relays patches once the joiner is promoted to write', async () => {
    const host = await connectClient();
    const { roomId } = await startRoom(host);
    const student = await connectClient();
    const joined = await joinRoom(student, roomId);
    if (!joined.joined) throw new Error('expected join to succeed');

    const rosterUpdated = nextEvent(student, 'rosterChanged');
    host.emit('setTier', { userId: joined.userId, tier: 'write' });
    await rosterUpdated;

    const relayed = nextEvent(host, 'serverStatePatched');
    student.emit('patchServerState', {
      payloadId: 'payload-2',
      productId: 'traversals',
      ops: [{ op: 'add', path: '/core/nodes/b', value: { x: 9 } }],
    });

    const relay = await relayed;
    expect(relay.payloadId).toBe('payload-2');
    expect(relay.version).toBe(2);
    expect(relay.ops).toHaveLength(1);
  });
});

describe('server state routing', () => {
  const enterProduct = (socket: ClientSocket, productId: string) =>
    new Promise<JoinResult>((resolve) => {
      socket.emit('enterProduct', { productId }, resolve);
    });

  // the server routes off the roster it already maintains, so nobody pays for
  // traffic on a product they are not looking at
  it('does not relay a patch to someone on a different product', async () => {
    const host = await connectClient();
    const { roomId } = await startRoom(host);
    const student = await connectClient();
    const joined = await joinRoom(student, roomId);
    if (!joined.joined) throw new Error('expected join to succeed');

    const rosterUpdated = nextEvent(student, 'rosterChanged');
    host.emit('setTier', { userId: joined.userId, tier: 'write' });
    await rosterUpdated;

    await enterProduct(student, 'basic-trees');

    const noRelay = expectNoEvent(student, 'serverStatePatched');
    host.emit('patchServerState', {
      payloadId: 'payload-4',
      productId: 'traversals',
      ops: [{ op: 'add', path: '/core/nodes/b', value: { x: 1 } }],
    });
    await noRelay;
  });

  it('relays once both are on the same product again', async () => {
    const host = await connectClient();
    const { roomId } = await startRoom(host);
    const student = await connectClient();
    await joinRoom(student, roomId);

    await enterProduct(student, 'basic-trees');
    await enterProduct(student, 'traversals');

    const relayed = nextEvent(student, 'serverStatePatched');
    host.emit('patchServerState', {
      payloadId: 'payload-5',
      productId: 'traversals',
      ops: [{ op: 'add', path: '/core/nodes/b', value: { x: 1 } }],
    });

    expect((await relayed).payloadId).toBe('payload-5');
  });

  it('reports the move on the roster so peers can see where someone went', async () => {
    const host = await connectClient();
    const { roomId } = await startRoom(host);
    const student = await connectClient();

    // the join broadcasts its own roster update, so settle that before listening for
    // the one the move produces
    const joinRoster = nextEvent(host, 'rosterChanged');
    const joined = await joinRoom(student, roomId);
    if (!joined.joined) throw new Error('expected join to succeed');
    await joinRoster;

    const rosterUpdated = nextEvent(host, 'rosterChanged');
    await enterProduct(student, 'basic-trees');

    const roster = await rosterUpdated;
    expect(roster.roster[joined.userId]?.productId).toBe('basic-trees');
  });
});

describe('wholesale override', () => {
  // replaceServerState always comes from the client showing that product, so the emitter is
  // in the product channel and peers on that product hear it
  it('creates server state lazily and relays the replacement', async () => {
    const host = await connectClient();
    const { roomId } = await startRoom(host);
    const student = await connectClient();
    await joinRoom(student, roomId);

    const relayed = nextEvent(student, 'serverStateReplaced');
    host.emit('replaceServerState', {
      payloadId: 'payload-3',
      productId: 'traversals',
      state: { core: { nodes: {} } },
    });

    const relay = await relayed;
    expect(relay.productId).toBe('traversals');
    expect(relay.version).toBe(2);
    expect(relay.state).toEqual({ core: { nodes: {} } });
  });

  it('seeds a product nobody is on yet, reaching whoever enters next', async () => {
    const host = await connectClient();
    const { roomId } = await startRoom(host);

    host.emit('replaceServerState', {
      payloadId: 'payload-6',
      productId: 'basic-trees',
      state: { core: { nodes: { seeded: {} } } },
    });
    await new Promise((resolve) => setTimeout(resolve, 100));

    const student = await connectClient();
    await joinRoom(student, roomId);
    const entered = await new Promise<JoinResult>((resolve) => {
      student.emit('enterProduct', { productId: 'basic-trees' }, resolve);
    });

    expect(entered.joined).toBe(true);
    if (!entered.joined) return;
    expect(entered.serverState?.state).toEqual({ core: { nodes: { seeded: {} } } });
  });
});
