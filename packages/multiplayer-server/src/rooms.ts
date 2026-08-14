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
// default import then destructure: fast-json-patch is CJS with no exports map, so Node
// cannot statically resolve a named import from it. the esbuild bundle papers over this
// with interop, which is why it only surfaces under tsx in dev
import fastJsonPatch from 'fast-json-patch';

const { applyPatch } = fastJsonPatch;

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

/** roster removal only; a non host leaving never disbands anything */
export const removeMember = (room: Room, userId: UserId): void => {
  delete room.data.roster[userId];
};

/** host is a singleton set at room creation and never reassigned */
export const isHost = (room: Room, userId: UserId): boolean =>
  room.data.hostId === userId;

const tierOf = (room: Room, userId: UserId): Tier | undefined =>
  room.data.roster[userId]?.tier;

/** one flat rule for every product layer write, for every product */
export const canWriteProduct = (room: Room, userId: UserId): boolean => {
  const tier = tierOf(room, userId);
  return tier !== undefined && meetsFloor(tier, PRODUCT_WRITE_FLOOR);
};

/** moveUser and kickUser share this floor; setTier uses the ordinal rule instead */
export const canRunRoomCommand = (room: Room, userId: UserId): boolean => {
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

/** ungated: a display name authorizes nothing */
export const setMemberDisplayName = (
  room: Room,
  userId: UserId,
  displayName: string,
): boolean => {
  const entry = room.data.roster[userId];
  if (!entry) return false;
  entry.displayName = displayName;
  return true;
};

/** records where a member navigated, which is what server state relays route off */
export const setMemberProduct = (
  room: Room,
  userId: UserId,
  productId: ProductId,
): void => {
  const entry = room.data.roster[userId];
  if (!entry) return;
  entry.productId = productId;
};

/** false when refused, so the caller can skip the rebroadcast */
export const setTier = (
  room: Room,
  callerId: UserId,
  targetId: UserId,
  nextTier: AssignableTier,
): boolean => {
  const callerTier = tierOf(room, callerId);
  const target = room.data.roster[targetId];
  if (!callerTier || !target) return false;
  if (!canSetTier(callerTier, target.tier, nextTier)) return false;

  target.tier = nextTier;
  return true;
};

/** every live room, held in memory: a redeploy drops all of them, by design */
export type RoomStore = {
  get: (roomId: RoomId) => Room | undefined;
  set: (roomId: RoomId, room: Room) => void;
  /** disband retains nothing */
  delete: (roomId: RoomId) => void;
  has: (roomId: RoomId) => boolean;
};

export const createRoomStore = (): RoomStore => {
  const roomIdToRoom = new Map<RoomId, Room>();

  return {
    get: (roomId) => roomIdToRoom.get(roomId),
    set: (roomId, room) => {
      roomIdToRoom.set(roomId, room);
    },
    delete: (roomId) => {
      roomIdToRoom.delete(roomId);
    },
    has: (roomId) => roomIdToRoom.has(roomId),
  };
};
