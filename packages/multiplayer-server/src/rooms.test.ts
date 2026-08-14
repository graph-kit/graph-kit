import { describe, expect, it } from 'vitest';

import {
  Room,
  addMember,
  canRunRoomCommand,
  canWriteProduct,
  createRoom,
  getServerState,
  isHost,
  patchServerState,
  removeMember,
  replaceServerState,
  setTier,
} from './rooms.ts';

const seedRoom = (): Room =>
  createRoom({
    hostId: 'host-1',
    displayName: 'Professor',
    productId: 'traversals',
    state: { core: { nodes: { a: { x: 0 } } } },
  });

describe('createRoom', () => {
  it('seeds only the host current product', () => {
    const room = seedRoom();

    expect(Object.keys(room.products)).toEqual(['traversals']);
    expect(room.products.traversals?.version).toBe(1);
  });

  it('starts with a roster of one, at host tier', () => {
    const room = seedRoom();

    expect(room.data.roster['host-1']?.tier).toBe('host');
    expect(isHost(room, 'host-1')).toBe(true);
  });
});

describe('membership', () => {
  it('admits new joiners at write', () => {
    const room = seedRoom();
    const entry = addMember(room, {
      userId: 'user-2',
      displayName: 'Student',
      productId: 'traversals',
    });

    expect(entry.tier).toBe('write');
    expect(canWriteProduct(room, 'user-2')).toBe(true);
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

  it('refuses a write user trying to promote themselves', () => {
    const room = roomWithStudent();

    expect(setTier(room, 'user-2', 'user-2', 'admin')).toBe(false);
    expect(room.data.roster['user-2']?.tier).toBe('write');
  });

  it('refuses demoting the host', () => {
    const room = roomWithStudent();
    setTier(room, 'host-1', 'user-2', 'admin');

    expect(setTier(room, 'user-2', 'host-1', 'write')).toBe(false);
    expect(room.data.roster['host-1']?.tier).toBe('host');
  });
});

describe('patchServerState', () => {
  it('advances the version and reports a hash', () => {
    const room = seedRoom();
    const receipt = patchServerState(room, 'traversals', [
      { op: 'add', path: '/core/nodes/b', value: { x: 5 } },
    ]);

    expect(receipt?.version).toBe(2);
    expect(receipt?.stateHash).toEqual(expect.any(String));
    expect(room.products.traversals?.state).toEqual({
      core: { nodes: { a: { x: 0 }, b: { x: 5 } } },
    });
  });

  it('returns null for a product with no server state yet', () => {
    const room = seedRoom();

    expect(patchServerState(room, 'basic-trees', [])).toBeNull();
  });
});

describe('replaceServerState', () => {
  it('creates server state lazily on first write', () => {
    const room = seedRoom();
    const receipt = replaceServerState(room, 'basic-trees', {
      core: { nodes: {} },
    });

    expect(receipt.version).toBe(1);
    expect(getServerState(room, 'basic-trees')).not.toBeNull();
  });

  it('overwrites wholesale and advances the version', () => {
    const room = seedRoom();
    const receipt = replaceServerState(room, 'traversals', {
      core: { nodes: {} },
    });

    expect(receipt.version).toBe(2);
    expect(room.products.traversals?.state).toEqual({ core: { nodes: {} } });
  });

  // a replace is authoritative, so it never consults the caller's version
  it('resets diverged server state regardless of prior state', () => {
    const room = seedRoom();
    patchServerState(room, 'traversals', [
      { op: 'add', path: '/core/nodes/b', value: { x: 5 } },
    ]);
    const receipt = replaceServerState(room, 'traversals', {
      core: { nodes: {} },
    });

    expect(receipt.version).toBe(3);
    expect(receipt.stateHash).toBe(
      getServerState(room, 'traversals')?.stateHash,
    );
  });
});
