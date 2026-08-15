// @vitest-environment node
import { createServer } from 'node:http';
import { AddressInfo } from 'node:net';

import { DocUpdate } from '@multiplayer/protocol/doc';
import {
  ClientToServerEvents,
  JoinResult,
  ServerToClientEvents,
} from '@multiplayer/protocol/events';
import { RoomMembership } from '@multiplayer/protocol/room';
import { Socket, io as connect } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as Y from 'yjs';

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
  new Promise<Parameters<ServerToClientEvents[Event]>[0]>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`timed out waiting for ${String(event)}`)),
      timeoutMs,
    );
    socket.once(event as any, (payload: any) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });

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

/** a document holding one node, in the shape a graph product would write */
const seedDoc = () => {
  const doc = new Y.Doc();
  doc.getMap('nodes').set('a', { x: 0 });
  return doc;
};

const readNodes = (update: Uint8Array) => {
  const doc = new Y.Doc();
  Y.applyUpdate(doc, update);
  return doc.getMap('nodes').toJSON();
};

/** one node added on top of the seed, as a peer's update would arrive */
const addNodeUpdate = (id: string) => {
  const doc = new Y.Doc();
  doc.getMap('nodes').set(id, { x: 9 });
  return Y.encodeStateAsUpdate(doc);
};

const startRoom = (socket: ClientSocket) =>
  new Promise<RoomMembership>((resolve) => {
    socket.emit(
      'startRoom',
      {
        displayName: 'Professor',
        productId: 'traversals',
        doc: Y.encodeStateAsUpdate(seedDoc()),
      },
      resolve,
    );
  });

const joinRoom = (socket: ClientSocket, roomId: string) =>
  new Promise<JoinResult>((resolve) => {
    socket.emit('joinRoom', { roomId, displayName: 'Student' }, resolve);
  });

const enterProduct = (socket: ClientSocket, productId: string) =>
  new Promise<DocUpdate | null>((resolve) => {
    socket.emit('enterProduct', { productId }, resolve);
  });

/** every client enters a product on its first mount, which is where its document comes from */
const joinRoomAt = async (
  socket: ClientSocket,
  roomId: string,
  productId: string,
) => {
  const result = await joinRoom(socket, roomId);
  if (!result.joined) throw new Error('expected join to succeed');
  return { ...result, doc: await enterProduct(socket, productId) };
};

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
  it('hands a joiner the host seeded document on the product it enters', async () => {
    const host = await connectClient();
    const { roomId } = await startRoom(host);

    const student = await connectClient();
    const { doc } = await joinRoomAt(student, roomId, 'traversals');

    if (!doc) throw new Error('expected the seeded document');
    expect(readNodes(doc)).toEqual({ a: { x: 0 } });
  });

  it('treats a dead room id as a non event rather than an error', async () => {
    const student = await connectClient();
    const result = await joinRoom(student, 'does-not-exist');

    expect(result).toEqual({ joined: false });
  });

  it('identifies a room by a short code that can be read out loud', async () => {
    const host = await connectClient();
    const { roomId } = await startRoom(host);

    expect(roomId).toMatch(/^[a-z]{4}$/);
  });

  // the code is short enough to type by hand, and nobody types the case
  it('joins a room whose code was typed in upper case', async () => {
    const host = await connectClient();
    const { roomId } = await startRoom(host);

    const student = await connectClient();
    const result = await joinRoom(student, roomId.toUpperCase());

    expect(result.joined).toBe(true);
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
  it('relays updates from a joiner, who arrives able to write', async () => {
    const host = await connectClient();
    const { roomId } = await startRoom(host);
    const student = await connectClient();
    const joined = await joinRoom(student, roomId);
    if (!joined.joined) throw new Error('expected join to succeed');

    const relayed = nextEvent(host, 'docUpdated');
    student.emit('docUpdate', {
      productId: 'traversals',
      update: addNodeUpdate('b'),
    });

    const relay = await relayed;
    expect(relay.productId).toBe('traversals');
    expect(readNodes(relay.update)).toEqual({ b: { x: 9 } });
  });

  it('drops updates from a socket that never joined the room', async () => {
    const host = await connectClient();
    await startRoom(host);
    const stranger = await connectClient();

    const noRelay = expectNoEvent(host, 'docUpdated');
    stranger.emit('docUpdate', {
      productId: 'traversals',
      update: addNodeUpdate('b'),
    });
    await noRelay;
  });

  // the author never hears its own relay, so a reconnect asks for what it is missing
  it('answers a state vector with only the missing updates', async () => {
    const host = await connectClient();
    const { roomId } = await startRoom(host);
    const student = await connectClient();
    const { doc } = await joinRoomAt(student, roomId, 'traversals');
    if (!doc) throw new Error('expected the seeded document');

    const caughtUp = new Y.Doc();
    Y.applyUpdate(caughtUp, doc);

    host.emit('docUpdate', {
      productId: 'traversals',
      update: addNodeUpdate('b'),
    });
    await new Promise((resolve) => setTimeout(resolve, 100));

    const missing = await new Promise<Uint8Array | null>((resolve) => {
      student.emit(
        'syncDoc',
        {
          productId: 'traversals',
          stateVector: Y.encodeStateVector(caughtUp),
        },
        resolve,
      );
    });

    expect(readNodes(missing!)).toEqual({ b: { x: 9 } });
  });
});

describe('renaming', () => {
  // being able to fix a name mid session is what removes the need to gate room
  // creation on setting one first
  it('updates the roster and tells everyone', async () => {
    const host = await connectClient();
    const { roomId } = await startRoom(host);
    const student = await connectClient();

    const joinRoster = nextEvent(host, 'rosterChanged');
    const joined = await joinRoom(student, roomId);
    if (!joined.joined) throw new Error('expected join to succeed');
    await joinRoster;

    const renamed = nextEvent(host, 'rosterChanged');
    student.emit('setDisplayName', { displayName: 'Ada' });

    const roster = await renamed;
    expect(roster.roster[joined.userId]?.displayName).toBe('Ada');
  });

  // renaming authorizes nothing, so the lowest tier can do it like anyone else
  it('is not gated by tier', async () => {
    const host = await connectClient();
    const { roomId } = await startRoom(host);
    const student = await connectClient();

    const joinRoster = nextEvent(host, 'rosterChanged');
    const joined = await joinRoom(student, roomId);
    if (!joined.joined) throw new Error('expected join to succeed');
    await joinRoster;
    expect(joined.data.roster[joined.userId]?.tier).toBe('write');

    const renamed = nextEvent(host, 'rosterChanged');
    student.emit('setDisplayName', { displayName: 'Grace' });

    const roster = await renamed;
    expect(roster.roster[joined.userId]?.displayName).toBe('Grace');
  });

  it('leaves other members untouched', async () => {
    const host = await connectClient();
    const { roomId } = await startRoom(host);
    const student = await connectClient();

    const joinRoster = nextEvent(host, 'rosterChanged');
    const joined = await joinRoom(student, roomId);
    if (!joined.joined) throw new Error('expected join to succeed');
    await joinRoster;

    const renamed = nextEvent(host, 'rosterChanged');
    student.emit('setDisplayName', { displayName: 'Ada' });
    const roster = await renamed;

    const hostEntry = Object.values(roster.roster).find(
      (entry) => entry.tier === 'host',
    );
    expect(hostEntry?.displayName).toBe('Professor');
  });
});

describe('document routing', () => {
  // the server routes off the roster it already maintains, so nobody pays for
  // traffic on a product they are not looking at
  it('does not relay an update to someone on a different product', async () => {
    const host = await connectClient();
    const { roomId } = await startRoom(host);
    const student = await connectClient();
    const joined = await joinRoom(student, roomId);
    if (!joined.joined) throw new Error('expected join to succeed');

    await enterProduct(student, 'basic-trees');

    const noRelay = expectNoEvent(student, 'docUpdated');
    host.emit('docUpdate', {
      productId: 'traversals',
      update: addNodeUpdate('b'),
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

    const relayed = nextEvent(student, 'docUpdated');
    host.emit('docUpdate', {
      productId: 'traversals',
      update: addNodeUpdate('b'),
    });

    expect(readNodes((await relayed).update)).toEqual({ b: { x: 9 } });
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

describe('lazy document creation', () => {
  // no product needs a declarable empty state, so the first update is what creates it
  it('seeds a product nobody is on yet, reaching whoever enters next', async () => {
    const host = await connectClient();
    const { roomId } = await startRoom(host);

    host.emit('docUpdate', {
      productId: 'basic-trees',
      update: addNodeUpdate('seeded'),
    });
    await new Promise((resolve) => setTimeout(resolve, 100));

    const student = await connectClient();
    const { doc } = await joinRoomAt(student, roomId, 'basic-trees');

    if (!doc) throw new Error('expected the lazily created document');
    expect(readNodes(doc)).toEqual({ seeded: { x: 9 } });
  });
});
