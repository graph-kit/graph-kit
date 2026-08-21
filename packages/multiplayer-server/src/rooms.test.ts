import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';

import {
  Room,
  addMember,
  applyProductDocUpdate,
  canRunRoomCommand,
  canWriteProduct,
  createRoom,
  encodeProductDoc,
  encodeProductDocDiff,
  isHost,
  removeMember,
  setTier,
} from './rooms.ts';

/** a document holding one node, in the shape a graph product would write */
const seedDoc = () => {
  const doc = new Y.Doc();
  doc.getMap('nodes').set('a', { x: 0 });
  return doc;
};

const seedRoom = (): Room =>
  createRoom({
    hostId: 'host-1',
    displayName: 'Professor',
    productId: 'traversals',
    doc: Y.encodeStateAsUpdate(seedDoc()),
  });

/** what a client would end up with after applying everything the room hands out */
const readNodes = (update: Uint8Array) => {
  const doc = new Y.Doc();
  Y.applyUpdate(doc, update);
  return doc.getMap('nodes').toJSON();
};

describe('createRoom', () => {
  it('seeds only the host current product', () => {
    const room = seedRoom();

    expect(Object.keys(room.products)).toEqual(['traversals']);
    expect(readNodes(encodeProductDoc(room, 'traversals')!)).toEqual({
      a: { x: 0 },
    });
  });

  it('starts with a roster of one, at host tier', () => {
    const room = seedRoom();

    expect(room.data.roster['host-1']?.tier).toBe('host');
    expect(isHost(room, 'host-1')).toBe(true);
  });
});

describe('membership', () => {
  it('admits new joiners at read', () => {
    const room = seedRoom();
    const entry = addMember(room, {
      userId: 'user-2',
      displayName: 'Student',
      productId: 'traversals',
    });

    expect(entry.tier).toBe('read');
    expect(canWriteProduct(room, 'user-2')).toBe(false);
    expect(canRunRoomCommand(room, 'user-2')).toBe(false);
  });

  it('denies writes from users who are not in the room at all', () => {
    const room = seedRoom();

    expect(canWriteProduct(room, 'stranger')).toBe(false);
    expect(canRunRoomCommand(room, 'stranger')).toBe(false);
  });

  it('drops the member on removal', () => {
    const room = seedRoom();
    addMember(room, {
      userId: 'user-2',
      displayName: 'Student',
      productId: 'traversals',
    });
    removeMember(room, 'user-2');

    expect(room.data.roster['user-2']).toBeUndefined();
  });
});

describe('setTier', () => {
  const roomWithStudent = () => {
    const room = seedRoom();
    addMember(room, {
      userId: 'user-2',
      displayName: 'Student',
      productId: 'traversals',
    });
    return room;
  };

  it('lets the host promote to admin', () => {
    const room = roomWithStudent();

    expect(setTier(room, 'host-1', 'user-2', 'admin')).toBe(true);
    expect(canRunRoomCommand(room, 'user-2')).toBe(true);
  });

  it('refuses a member trying to promote themselves', () => {
    const room = roomWithStudent();

    expect(setTier(room, 'user-2', 'user-2', 'admin')).toBe(false);
    expect(room.data.roster['user-2']?.tier).toBe('read');
  });

  it('grants product writes on promotion out of read', () => {
    const room = roomWithStudent();
    expect(canWriteProduct(room, 'user-2')).toBe(false);

    expect(setTier(room, 'host-1', 'user-2', 'write')).toBe(true);
    expect(canWriteProduct(room, 'user-2')).toBe(true);
  });

  it('refuses demoting the host', () => {
    const room = roomWithStudent();
    setTier(room, 'host-1', 'user-2', 'admin');

    expect(setTier(room, 'user-2', 'host-1', 'write')).toBe(false);
    expect(room.data.roster['host-1']?.tier).toBe('host');
  });
});

describe('applyProductDocUpdate', () => {
  it('merges an update into the product document', () => {
    const room = seedRoom();
    const peer = seedDoc();
    peer.getMap('nodes').set('b', { x: 5 });

    applyProductDocUpdate(
      room,
      'traversals',
      Y.encodeStateAsUpdate(peer, Y.encodeStateVector(seedDoc())),
    );

    expect(readNodes(encodeProductDoc(room, 'traversals')!)).toEqual({
      a: { x: 0 },
      b: { x: 5 },
    });
  });

  // no product needs a declarable empty state, so the first write is what creates it
  it('creates the document for a product nobody has opened', () => {
    const room = seedRoom();
    expect(encodeProductDoc(room, 'basic-trees')).toBeNull();

    applyProductDocUpdate(
      room,
      'basic-trees',
      Y.encodeStateAsUpdate(seedDoc()),
    );

    expect(readNodes(encodeProductDoc(room, 'basic-trees')!)).toEqual({
      a: { x: 0 },
    });
  });

  // the property the whole design rests on: order and repetition do not matter
  it('lands on the same document whatever order updates arrive in', () => {
    const first = new Y.Doc();
    first.getMap('nodes').set('a', { x: 1 });
    const second = new Y.Doc();
    second.getMap('nodes').set('b', { x: 2 });

    const updates = [
      Y.encodeStateAsUpdate(first),
      Y.encodeStateAsUpdate(second),
    ];

    // both rooms start from the same bytes, since two documents built to hold equal
    // content still carry different client ids and would resolve conflicts differently
    const seed = Y.encodeStateAsUpdate(seedDoc());
    const roomFromSeed = () =>
      createRoom({
        hostId: 'host-1',
        displayName: 'Professor',
        productId: 'traversals',
        doc: seed,
      });

    const forward = roomFromSeed();
    for (const update of updates) {
      applyProductDocUpdate(forward, 'traversals', update);
    }

    const reversed = roomFromSeed();
    for (const update of [...updates].reverse()) {
      applyProductDocUpdate(reversed, 'traversals', update);
      // applied twice on purpose, since a relay can legitimately arrive again
      applyProductDocUpdate(reversed, 'traversals', update);
    }

    expect(readNodes(encodeProductDoc(reversed, 'traversals')!)).toEqual(
      readNodes(encodeProductDoc(forward, 'traversals')!),
    );
  });
});

describe('encodeProductDocDiff', () => {
  // what makes a reconnect cost the diff rather than the document
  it('returns only what the client is missing', () => {
    const room = seedRoom();

    // caught up by having applied the room's own document, not by holding equal content:
    // an independently built document has its own client id and would look unseen
    const client = new Y.Doc();
    Y.applyUpdate(client, encodeProductDoc(room, 'traversals')!);
    expect(
      readNodes(
        encodeProductDocDiff(room, 'traversals', Y.encodeStateVector(client))!,
      ),
    ).toEqual({});

    const peer = new Y.Doc();
    peer.getMap('nodes').set('b', { x: 5 });
    applyProductDocUpdate(room, 'traversals', Y.encodeStateAsUpdate(peer));

    const diff = encodeProductDocDiff(
      room,
      'traversals',
      Y.encodeStateVector(client),
    );
    expect(readNodes(diff!)).toEqual({ b: { x: 5 } });
  });

  it('returns null for a product nobody has opened', () => {
    const room = seedRoom();

    expect(
      encodeProductDocDiff(
        room,
        'basic-trees',
        Y.encodeStateVector(new Y.Doc()),
      ),
    ).toBeNull();
  });
});
