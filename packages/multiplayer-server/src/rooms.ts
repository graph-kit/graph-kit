import { DocStateVector, DocUpdate } from '@multiplayer/protocol/doc';
import {
  ProductId,
  RoomData,
  RoomId,
  RosterEntry,
  UserId,
} from '@multiplayer/protocol/room';
import {
  AssignableTier,
  DEFAULT_TIER,
  PRODUCT_WRITE_FLOOR,
  ROOM_COMMAND_FLOOR,
  Tier,
  canSetTier,
  meetsFloor,
} from '@multiplayer/protocol/tiers';
import * as Y from 'yjs';

export type Room = {
  data: RoomData;
  /** one document per product, so a room can hold several without them interfering */
  products: Record<ProductId, Y.Doc>;
};

export const createRoom = (options: {
  hostId: UserId;
  displayName: string;
  productId: ProductId;
  doc: DocUpdate;
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
  // only the product the host was looking at is seeded, every other product's document is
  // created lazily on its first update so no product needs a declarable empty state
  products: {
    [options.productId]: docFromUpdate(options.doc),
  },
});

const docFromUpdate = (update: DocUpdate): Y.Doc => {
  const doc = new Y.Doc();
  Y.applyUpdate(doc, update);
  return doc;
};

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

/** the whole document, for a joiner who has nothing yet. null before anyone seeds it */
export const encodeProductDoc = (
  room: Room,
  productId: ProductId,
): DocUpdate | null => {
  const doc = room.products[productId];
  if (!doc) return null;
  return Y.encodeStateAsUpdate(doc);
};

/** only what the client is missing, which is what makes a reconnect cheap */
export const encodeProductDocDiff = (
  room: Room,
  productId: ProductId,
  stateVector: DocStateVector,
): DocUpdate | null => {
  const doc = room.products[productId];
  if (!doc) return null;
  return Y.encodeStateAsUpdate(doc, stateVector);
};

/**
 * Merged blindly: the server never inspects what an update contains, which is what keeps
 * it agnostic to what any product stores. Creates the document on first write, so a
 * product nobody has opened yet costs nothing.
 */
export const applyProductDocUpdate = (
  room: Room,
  productId: ProductId,
  update: DocUpdate,
): void => {
  const doc = (room.products[productId] ??= new Y.Doc());
  Y.applyUpdate(doc, update);
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
