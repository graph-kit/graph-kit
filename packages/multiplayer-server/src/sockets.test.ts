// @vitest-environment node
import { createServer } from 'node:http';
import { AddressInfo } from 'node:net';

import { DocUpdate } from '@multiplayer/protocol/doc';
import {
  ClientToServerEvents,
  JoinResult,
  ProductEntryState,
  ServerToClientEvents,
} from '@multiplayer/protocol/events';
import {
  RoomMembership,
  Seat,
  emptyProductPresence,
} from '@multiplayer/protocol/room';
import { Socket, io as connect } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as Y from 'yjs';

import { RoomSweepOptions } from './room-sweep.ts';
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

const joinRoom = (socket: ClientSocket, roomId: string, seat?: Seat) =>
  new Promise<JoinResult>((resolve) => {
    socket.emit('joinRoom', { roomId, displayName: 'Student', seat }, resolve);
  });

/** what a client keeps out of an admission, and all it needs to sit back down */
const seatOf = (membership: RoomMembership): Seat => ({
  userId: membership.userId,
  token: membership.seatToken,
});

/** a join that must succeed, since a dead room is never what these are testing */
const joinRoomOrThrow = async (
  socket: ClientSocket,
  roomId: string,
  seat?: Seat,
) => {
  const result = await joinRoom(socket, roomId, seat);
  if (!result.joined) throw new Error('expected join to succeed');
  return result;
};

const enterProduct = (socket: ClientSocket, productId: string) =>
  new Promise<ProductEntryState>((resolve) => {
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
  return { ...result, ...(await enterProduct(socket, productId)) };
};

/** short enough that a test can wait one out, long enough not to trip on scheduling */
const STALE_AFTER_MS = 120;

/** far longer than any test takes, so only the tests that want it see a room expire */
const NEVER_INACTIVE: RoomSweepOptions = {
  inactiveAfterMs: 60_000,
  sweepIntervalMs: 20,
};

const startServer = async (roomSweep: RoomSweepOptions = NEVER_INACTIVE) => {
  httpServer = createServer();
  ioServer = createSocketServer(httpServer, {
    corsOrigins: ['*'],
    dragSweep: { staleAfterMs: STALE_AFTER_MS, sweepIntervalMs: 20 },
    roomSweep,
  });
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  port = (httpServer.address() as AddressInfo).port;
};

const stopServer = async () => {
  for (const socket of openSockets) socket.disconnect();
  openSockets.length = 0;
  ioServer.close();
  await new Promise<void>((resolve) => {
    httpServer.close(() => resolve());
  });
};

beforeEach(() => startServer());

afterEach(() => stopServer());

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

  // a blip is not a decision: the room outlives the connection that opened it
  it('keeps the room when the host disconnects', async () => {
    const host = await connectClient();
    const membership = await startRoom(host);
    const student = await connectClient();
    await joinRoom(student, membership.roomId);

    const stillAlive = expectNoEvent(student, 'roomDisbanded');
    host.disconnect();
    await stillAlive;
  });

  it('holds the seat of a member who drops, marked as away', async () => {
    const host = await connectClient();
    const { roomId } = await startRoom(host);
    const student = await connectClient();
    const joinRoster = nextEvent(host, 'rosterChanged');
    const joined = await joinRoomOrThrow(student, roomId);
    await joinRoster;

    const rosterUpdated = nextEvent(host, 'rosterChanged');
    student.disconnect();
    const roster = (await rosterUpdated).roster;

    expect(roster[joined.userId]).toMatchObject({
      displayName: 'Student',
      connected: false,
    });
  });

  it('disbands the room when the host leaves on purpose', async () => {
    const host = await connectClient();
    const { roomId } = await startRoom(host);
    const student = await connectClient();
    await joinRoom(student, roomId);

    const disbanded = nextEvent(student, 'roomDisbanded');
    host.emit('leaveRoom');
    expect(await disbanded).toEqual({ reason: 'hostLeft' });
  });

  it('spends the seat of a member who leaves on purpose', async () => {
    const host = await connectClient();
    const { roomId } = await startRoom(host);
    const student = await connectClient();
    const joinRoster = nextEvent(host, 'rosterChanged');
    const joined = await joinRoomOrThrow(student, roomId);
    await joinRoster;

    const rosterUpdated = nextEvent(host, 'rosterChanged');
    student.emit('leaveRoom');
    const roster = (await rosterUpdated).roster;

    expect(roster[joined.userId]).toBeUndefined();
  });
});

describe('seats', () => {
  it('hands a returning member back the same identity and tier', async () => {
    const host = await connectClient();
    const { roomId } = await startRoom(host);
    const student = await connectClient();
    const joined = await joinRoomOrThrow(student, roomId);

    host.emit('setTier', { userId: joined.userId, tier: 'write' });
    await new Promise((resolve) => setTimeout(resolve, 50));
    student.disconnect();

    const returning = await connectClient();
    const back = await joinRoomOrThrow(returning, roomId, seatOf(joined));

    expect(back.userId).toBe(joined.userId);
    expect(back.data.roster[joined.userId]).toMatchObject({
      tier: 'write',
      connected: true,
    });

    // the tier is only real if it still buys what it bought before
    const relayed = nextEvent(host, 'docUpdated');
    returning.emit('docUpdate', {
      productId: 'traversals',
      update: addNodeUpdate('b'),
    });
    expect(readNodes((await relayed).update)).toEqual({ b: { x: 9 } });
  });

  it('returns a reconnecting host to their own room, still hosting', async () => {
    const host = await connectClient();
    const membership = await startRoom(host);
    const student = await connectClient();
    const joined = await joinRoomOrThrow(student, membership.roomId);
    host.disconnect();

    const returning = await connectClient();
    const back = await joinRoomOrThrow(
      returning,
      membership.roomId,
      seatOf(membership),
    );

    expect(back.userId).toBe(membership.userId);
    expect(back.data.hostId).toBe(membership.userId);

    // hosting is an authority, not a label, so it is tested as one
    const kicked = nextEvent(student, 'kicked');
    returning.emit('kickUser', { userId: joined.userId });
    await kicked;
  });

  // two tabs on one room read the same stored seat, and both claim it
  it('hands a live seat to a newer claim, turning the older one out', async () => {
    const host = await connectClient();
    const membership = await startRoom(host);

    const newerTab = await connectClient();
    const taken = nextEvent(host, 'seatTaken');
    const result = await joinRoomOrThrow(
      newerTab,
      membership.roomId,
      seatOf(membership),
    );

    await taken;
    expect(result.userId).toBe(membership.userId);
    expect(result.data.hostId).toBe(membership.userId);
    // one seat, not two: a takeover moves somebody rather than admitting them
    expect(Object.keys(result.data.roster)).toEqual([membership.userId]);
  });

  // the loser keeps its socket, and must be holding nothing the winner now owns
  it('leaves a turned out tab unable to act as the seat it lost', async () => {
    const host = await connectClient();
    const membership = await startRoom(host);
    const student = await connectClient();
    await joinRoomAt(student, membership.roomId, 'traversals');

    const newerTab = await connectClient();
    const taken = nextEvent(host, 'seatTaken');
    await joinRoomOrThrow(newerTab, membership.roomId, seatOf(membership));
    await taken;

    // the old tab dropping must not mark the seat away or unseat the tab holding it
    const rosterUpdated = expectNoEvent(student, 'rosterChanged');
    host.disconnect();
    await rosterUpdated;

    // and the winner still holds everything the seat carried
    const relayed = nextEvent(student, 'docUpdated');
    newerTab.emit('docUpdate', {
      productId: 'traversals',
      update: addNodeUpdate('b'),
    });
    await relayed;
  });

  it('refuses a claim carrying the wrong token', async () => {
    const host = await connectClient();
    const membership = await startRoom(host);
    host.disconnect();

    const impostor = await connectClient();
    const result = await joinRoomOrThrow(impostor, membership.roomId, {
      userId: membership.userId,
      token: 'not-the-token',
    });

    expect(result.userId).not.toBe(membership.userId);
  });

  // the client cannot know its claim is stale until it makes it, so this is the answer
  it('seats a claim it cannot place rather than refusing the join', async () => {
    const host = await connectClient();
    const { roomId } = await startRoom(host);

    const student = await connectClient();
    const result = await joinRoomOrThrow(student, roomId, {
      userId: 'nobody',
      token: 'nothing',
    });

    expect(result.userId).not.toBe('nobody');
    expect(result.data.roster[result.userId]).toMatchObject({ tier: 'read' });
  });

  it('leaves a kicked member nothing to reclaim', async () => {
    const host = await connectClient();
    const { roomId } = await startRoom(host);
    const student = await connectClient();
    const joined = await joinRoomOrThrow(student, roomId);

    host.emit('kickUser', { userId: joined.userId });
    await nextEvent(student, 'kicked');

    const returning = await connectClient();
    const back = await joinRoomOrThrow(returning, roomId, seatOf(joined));

    expect(back.userId).not.toBe(joined.userId);
    expect(back.data.roster[joined.userId]).toBeUndefined();
  });
});

describe('room inactivity', () => {
  /** long enough to send something inside, short enough for a test to wait one out */
  const INACTIVE_AFTER_MS = 200;

  const startImpatientServer = async () => {
    await stopServer();
    await startServer({
      inactiveAfterMs: INACTIVE_AFTER_MS,
      sweepIntervalMs: 20,
    });
  };

  it('disbands a room that went quiet, telling whoever is still in it', async () => {
    await startImpatientServer();
    const host = await connectClient();
    const { roomId } = await startRoom(host);
    const student = await connectClient();
    await joinRoom(student, roomId);

    const disbanded = nextEvent(
      student,
      'roomDisbanded',
      INACTIVE_AFTER_MS * 4,
    );
    expect(await disbanded).toEqual({ reason: 'inactivity' });

    // and the code dies with it, which is what a stale claim eventually runs into
    const late = await connectClient();
    expect(await joinRoom(late, roomId)).toEqual({ joined: false });
  });

  // the weakest signal there is, and the one that has to count: somebody is right there
  it('holds a room open on nothing more than a moving cursor', async () => {
    await startImpatientServer();
    const host = await connectClient();
    const { roomId } = await startRoom(host);
    const student = await connectClient();
    await joinRoomAt(student, roomId, 'traversals');

    const stillAlive = expectNoEvent(
      student,
      'roomDisbanded',
      INACTIVE_AFTER_MS * 3,
    );
    const nudging = setInterval(
      () => student.emit('moveCursor', { position: { x: 1, y: 1 } }),
      INACTIVE_AFTER_MS / 4,
    );
    await stillAlive;
    clearInterval(nudging);
  });
});

describe('product layer privilege', () => {
  it('drops updates from a joiner, who arrives read only', async () => {
    const host = await connectClient();
    const { roomId } = await startRoom(host);
    const student = await connectClient();
    const joined = await joinRoom(student, roomId);
    if (!joined.joined) throw new Error('expected join to succeed');

    const noRelay = expectNoEvent(host, 'docUpdated');
    student.emit('docUpdate', {
      productId: 'traversals',
      update: addNodeUpdate('b'),
    });
    await noRelay;
  });

  it('relays updates from a joiner the host has assigned write', async () => {
    const host = await connectClient();
    const { roomId } = await startRoom(host);
    const student = await connectClient();
    const joined = await joinRoom(student, roomId);
    if (!joined.joined) throw new Error('expected join to succeed');

    host.emit('setTier', { userId: joined.userId, tier: 'write' });
    await new Promise((resolve) => setTimeout(resolve, 50));

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
    expect(joined.data.roster[joined.userId]?.tier).toBe('read');

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

describe('presence scoping', () => {
  const dragged = [{ id: 'n1', position: { x: 1, y: 2 } }];

  it('keeps a cursor off a peer looking at a different product', async () => {
    const host = await connectClient();
    const { roomId } = await startRoom(host);

    const student = await connectClient();
    await joinRoomAt(student, roomId, 'basic-trees');

    // the host is on traversals, the student on basic-trees, so nothing should cross
    const unseen = expectNoEvent(student, 'cursorMoved');
    host.emit('moveCursor', { position: { x: 5, y: 5 } });
    await unseen;
  });

  it('relays a cursor to a peer on the same product', async () => {
    const host = await connectClient();
    const { roomId } = await startRoom(host);

    const student = await connectClient();
    await joinRoomAt(student, roomId, 'traversals');

    const moved = nextEvent(student, 'cursorMoved');
    host.emit('moveCursor', { position: { x: 5, y: 5 } });

    expect((await moved).position).toEqual({ x: 5, y: 5 });
  });

  it('hands an arriving client what everyone on the product is already doing', async () => {
    const host = await connectClient();
    const { roomId, userId: hostId } = await startRoom(host);

    host.emit('moveCursor', { position: { x: 7, y: 8 } });
    host.emit('startDrag', { elements: dragged });
    await new Promise((resolve) => setTimeout(resolve, 50));

    // no mouse has moved since this client arrived, and it still knows where the host is
    const student = await connectClient();
    const { presence } = await joinRoomAt(student, roomId, 'traversals');

    expect(presence[hostId].cursorPosition).toEqual({ x: 7, y: 8 });
    expect(presence[hostId].drag).toEqual(dragged);
  });

  it('announces an arrival to everyone already on the product', async () => {
    const host = await connectClient();
    const { roomId } = await startRoom(host);

    const student = await connectClient();
    const arrived = nextEvent(host, 'peerEnteredProduct');
    const joined = await joinRoomAt(student, roomId, 'traversals');

    expect((await arrived).userId).toBe(joined.userId);
  });

  it('does not announce an arrival on a product nobody else is on', async () => {
    const host = await connectClient();
    const { roomId } = await startRoom(host);

    const student = await connectClient();
    const unseen = expectNoEvent(host, 'peerEnteredProduct');
    await joinRoomAt(student, roomId, 'basic-trees');
    await unseen;
  });

  it('hands a later arrival a member who has never moved', async () => {
    const host = await connectClient();
    const { roomId, userId: hostId } = await startRoom(host);

    // the host has sent no signal at all, and is still someone to know about
    const student = await connectClient();
    const { presence } = await joinRoomAt(student, roomId, 'traversals');

    expect(presence[hostId]).toEqual(emptyProductPresence());
  });

  it('leaves the arriving client out of its own entry payload', async () => {
    const host = await connectClient();
    const { roomId } = await startRoom(host);

    const student = await connectClient();
    const joined = await joinRoomAt(student, roomId, 'traversals');
    student.emit('moveCursor', { position: { x: 1, y: 1 } });
    await new Promise((resolve) => setTimeout(resolve, 50));

    const again = await enterProduct(student, 'traversals');
    expect(again.presence[joined.userId]).toBeUndefined();
  });
});

describe('drag release', () => {
  const dragged = [{ id: 'n1', position: { x: 1, y: 2 } }];

  /** a room with two members looking at the same product, both mid conversation */
  const roomOfTwo = async () => {
    const host = await connectClient();
    const { roomId } = await startRoom(host);
    const student = await connectClient();
    const joined = await joinRoomAt(student, roomId, 'traversals');
    return { host, student, roomId, studentId: joined.userId };
  };

  it('releases on a drop', async () => {
    const { host, student } = await roomOfTwo();

    student.emit('startDrag', { elements: dragged });
    await nextEvent(host, 'dragStarted');

    const ended = nextEvent(host, 'dragEnded');
    student.emit('endDrag');
    await ended;
  });

  it('releases when the dragger leaves the product', async () => {
    const { host, student, studentId } = await roomOfTwo();

    student.emit('startDrag', { elements: dragged });
    await nextEvent(host, 'dragStarted');

    const left = nextEvent(host, 'peerLeftProduct');
    student.emit('leaveProduct', { productId: 'traversals' });

    expect((await left).userId).toBe(studentId);
  });

  it('releases when the dragger navigates to another product', async () => {
    const { host, student, studentId } = await roomOfTwo();

    student.emit('startDrag', { elements: dragged });
    await nextEvent(host, 'dragStarted');

    const left = nextEvent(host, 'peerLeftProduct');
    await enterProduct(student, 'basic-trees');

    expect((await left).userId).toBe(studentId);
  });

  it('releases when the dragger disconnects', async () => {
    const { host, student, studentId } = await roomOfTwo();

    student.emit('startDrag', { elements: dragged });
    await nextEvent(host, 'dragStarted');

    const left = nextEvent(host, 'peerLeftProduct');
    student.disconnect();

    expect((await left).userId).toBe(studentId);
  });

  it('releases a drag nobody has touched, without waiting on the ping timeout', async () => {
    const { host, student, studentId } = await roomOfTwo();

    student.emit('startDrag', { elements: dragged });
    await nextEvent(host, 'dragStarted');

    // the socket is alive and simply says nothing more, which no departure would catch
    const ended = await nextEvent(host, 'dragEnded', STALE_AFTER_MS * 8);
    expect(ended.userId).toBe(studentId);
  });

  it('leaves a drag that is still being moved alone', async () => {
    const { host, student } = await roomOfTwo();

    student.emit('startDrag', { elements: dragged });
    await nextEvent(host, 'dragStarted');

    const keepAlive = setInterval(
      () => student.emit('updateDrag', { elements: dragged }),
      STALE_AFTER_MS / 4,
    );
    await expectNoEvent(host, 'dragEnded', STALE_AFTER_MS * 3);
    clearInterval(keepAlive);
  });

  it('promotes a move for an already released drag back into a start', async () => {
    const { host, student, studentId } = await roomOfTwo();

    student.emit('startDrag', { elements: dragged });
    await nextEvent(host, 'dragStarted');
    await nextEvent(host, 'dragEnded', STALE_AFTER_MS * 8);

    // the gesture never ended, so the next move has to put it back rather than vanish
    const restarted = nextEvent(host, 'dragStarted');
    student.emit('updateDrag', { elements: dragged });

    expect((await restarted).userId).toBe(studentId);
  });
});

describe('live strokes', () => {
  const stroke = {
    id: 'stroke-1',
    mode: 'drawing' as const,
    points: [{ x: 0, y: 0 }],
    fillColor: '#ff0000',
    brushWeight: 6,
  };

  const roomOfTwo = async () => {
    const host = await connectClient();
    const { roomId } = await startRoom(host);
    const student = await connectClient();
    const joined = await joinRoomAt(student, roomId, 'traversals');
    return { host, student, roomId, studentId: joined.userId };
  };

  it('relays a stroke as it is drawn rather than when it commits', async () => {
    const { host, student, studentId } = await roomOfTwo();

    const started = nextEvent(host, 'strokeStarted');
    student.emit('startStroke', { stroke });
    expect(await started).toEqual({ userId: studentId, stroke });

    const extended = nextEvent(host, 'strokeExtended');
    student.emit('extendStroke', { points: [{ x: 1, y: 0 }] });
    expect(await extended).toEqual({
      userId: studentId,
      points: [{ x: 1, y: 0 }],
    });

    const ended = nextEvent(host, 'strokeEnded');
    student.emit('endStroke');
    expect((await ended).userId).toBe(studentId);
  });

  it('hands a later arrival a stroke that is still being drawn', async () => {
    const { host, student, roomId } = await roomOfTwo();

    student.emit('startStroke', { stroke });
    await nextEvent(host, 'strokeStarted');
    student.emit('extendStroke', { points: [{ x: 1, y: 0 }] });
    await nextEvent(host, 'strokeExtended');

    const latecomer = await connectClient();
    const { presence } = await joinRoomAt(latecomer, roomId, 'traversals');

    const [entry] = Object.values(presence).filter(({ stroke }) => stroke);
    expect(entry.stroke).toMatchObject({
      id: stroke.id,
      points: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ],
    });
  });

  it('drops a delta for a stroke it has no record of', async () => {
    const { host, student } = await roomOfTwo();

    // nothing named an id, a colour or a weight, so there is nothing to paint it as
    student.emit('extendStroke', { points: [{ x: 1, y: 0 }] });

    await expectNoEvent(host, 'strokeExtended', STALE_AFTER_MS);
  });

  it('clears a stroke when whoever was drawing it disconnects', async () => {
    const { host, student, studentId, roomId } = await roomOfTwo();

    student.emit('startStroke', { stroke });
    await nextEvent(host, 'strokeStarted');

    const left = nextEvent(host, 'peerLeftProduct');
    student.disconnect();
    expect((await left).userId).toBe(studentId);

    // gone from the room's copy too, so the next arrival is not handed a phantom
    const latecomer = await connectClient();
    const { presence } = await joinRoomAt(latecomer, roomId, 'traversals');
    expect(Object.values(presence).every(({ stroke }) => !stroke)).toBe(true);
  });

  it('leaves a laser held still on screen, since it sends nothing while held', async () => {
    const { host, student } = await roomOfTwo();

    student.emit('startStroke', { stroke: { ...stroke, mode: 'laser' } });
    await nextEvent(host, 'strokeStarted');

    // pointing at the thing being talked about is the ordinary case, and a sweep would
    // take it off everyone's canvas mid sentence with no delta to bring it back
    await expectNoEvent(host, 'strokeEnded', STALE_AFTER_MS * 4);
  });
});
