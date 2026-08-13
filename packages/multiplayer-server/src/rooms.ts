import {
  ProductId,
  RoomData,
  RoomId,
  RosterEntry,
  UserId,
} from '@multiplayer/protocol/room';
import {
  PatchOp,
  ProductRecord,
  ServerState,
  hashServerState,
} from '@multiplayer/protocol/server-state';
import {
  AssignableTier,
  DEFAULT_TIER,
  PRODUCT_WRITE_FLOOR,
  ROOM_COMMAND_FLOOR,
  Tier,
  canSetTier,
  meetsFloor,
} from '@multiplayer/protocol/tiers';
import { applyPatch } from 'fast-json-patch';

export type Room = {
  data: RoomData;
  products: Record<ProductId, ProductRecord>;
};

/** what every accepted write reports back, and what gets relayed to peers */
export type WriteReceipt = {
  version: number;
  stateHash: string;
};

const writeReceipt = (record: ProductRecord): WriteReceipt => ({
  version: record.version,
  stateHash: hashServerState(record.state),
});

export const createRoom = (options: {
  hostId: UserId;
  displayName: string;
  productId: ProductId;
  state: ServerState;
}): Room => ({
  data: {
    hostId: options.hostId,
    roster: {
      [options.hostId]: {
        userId: options.hostId,
        displayName: options.displayName,
        tier: 'host',
        productId: options.productId,
      },
    },
  },
  // only the product the host was looking at is seeded, every other product's server state is created
  // lazily on first push so no product needs a declarable empty state
  products: {
    [options.productId]: { state: options.state, version: 1 },
  },
});

export const addMember = (
  room: Room,
  options: { userId: UserId; displayName: string; productId: ProductId },
): RosterEntry => {
  const entry: RosterEntry = {
    userId: options.userId,
    displayName: options.displayName,
    tier: DEFAULT_TIER,
    productId: options.productId,
  };
  room.data.roster[options.userId] = entry;
  return entry;
};

export const removeMember = (room: Room, userId: UserId) => {
  delete room.data.roster[userId];
};

export const isHost = (room: Room, userId: UserId) =>
  room.data.hostId === userId;

export const tierOf = (room: Room, userId: UserId): Tier | undefined =>
  room.data.roster[userId]?.tier;

export const canWriteProduct = (room: Room, userId: UserId) => {
  const tier = tierOf(room, userId);
  return tier !== undefined && meetsFloor(tier, PRODUCT_WRITE_FLOOR);
};

export const canRunRoomCommand = (room: Room, userId: UserId) => {
  const tier = tierOf(room, userId);
  return tier !== undefined && meetsFloor(tier, ROOM_COMMAND_FLOOR);
};

export const getServerState = (
  room: Room,
  productId: ProductId,
): (ProductRecord & { stateHash: string }) | null => {
  const record = room.products[productId];
  if (!record) return null;
  return { ...record, stateHash: hashServerState(record.state) };
};

/**
 * applied blindly: the server never inspects paths or values, which is the whole reason
 * it can stay graph agnostic while still holding authoritative state
 */
export const patchServerState = (
  room: Room,
  productId: ProductId,
  ops: PatchOp[],
): WriteReceipt | null => {
  const record = room.products[productId];
  if (!record) return null;

  const { newDocument } = applyPatch(
    record.state,
    ops as Parameters<typeof applyPatch>[1],
    // validate ops, but do not mutate in place, so a failed patch leaves state untouched
    true,
    false,
  );

  record.state = newDocument as ServerState;
  record.version += 1;
  return writeReceipt(record);
};

/**
 * create-or-overwrite. authoritative by definition, so it sets the version rather than
 * checking one, which also makes every force push an implicit drift reset.
 */
export const replaceServerState = (
  room: Room,
  productId: ProductId,
  state: ServerState,
): WriteReceipt => {
  const existing = room.products[productId];
  const record: ProductRecord = {
    state,
    version: existing ? existing.version + 1 : 1,
  };
  room.products[productId] = record;
  return writeReceipt(record);
};

export const setMemberProduct = (
  room: Room,
  userId: UserId,
  productId: ProductId,
) => {
  const entry = room.data.roster[userId];
  if (!entry) return;
  entry.productId = productId;
};

export const setTier = (
  room: Room,
  callerId: UserId,
  targetId: UserId,
  nextTier: AssignableTier,
) => {
  const callerTier = tierOf(room, callerId);
  const target = room.data.roster[targetId];
  if (!callerTier || !target) return false;
  if (!canSetTier(callerTier, target.tier, nextTier)) return false;

  target.tier = nextTier;
  return true;
};

export const createRoomStore = () => {
  const roomIdToRoom = new Map<RoomId, Room>();

  return {
    get: (roomId: RoomId) => roomIdToRoom.get(roomId),
    set: (roomId: RoomId, room: Room) => roomIdToRoom.set(roomId, room),
    /** disband drops everything, nothing about the room is retained */
    delete: (roomId: RoomId) => roomIdToRoom.delete(roomId),
    has: (roomId: RoomId) => roomIdToRoom.has(roomId),
  };
};

export type RoomStore = ReturnType<typeof createRoomStore>;
