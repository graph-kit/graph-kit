import {
  DocStateVector,
  DocUpdate,
  toDocUpdate,
} from '@multiplayer/protocol/doc';
import {
  DraggedElement,
  ProductId,
  ProductPresence,
  RoomData,
  RoomId,
  RosterEntry,
  UserId,
  emptyProductPresence,
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

/**
 * everything one product in a room holds: the state everyone shares, and what each
 * member is doing in it right now. presence lives here rather than on the room because
 * it means nothing to a member looking at a different product
 */
export type ProductRoom = {
  doc: Y.Doc;
  presence: Record<UserId, ProductPresence>;
  /** server only, never on the wire: what {@link expireStaleDrags} reads */
  dragTouchedAt: Record<UserId, number>;
};

export type Room = {
  data: RoomData;
  /** one entry per product, so a room can hold several without them interfering */
  products: Record<ProductId, ProductRoom>;
};

const createProductRoom = (doc: Y.Doc): ProductRoom => ({
  doc,
  presence: {},
  dragTouchedAt: {},
});

/** created on first reach, so a product nobody has opened yet costs nothing */
const productIn = (room: Room, productId: ProductId): ProductRoom =>
  (room.products[productId] ??= createProductRoom(new Y.Doc()));

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
    [options.productId]: createProductRoom(docFromUpdate(options.doc)),
  },
});

const docFromUpdate = (update: DocUpdate): Y.Doc => {
  const doc = new Y.Doc();
  Y.applyUpdate(doc, toDocUpdate(update));
  return doc;
};

export const addMember = (
  room: Room,
  options: { userId: UserId; displayName: string },
): RosterEntry => {
  const entry: RosterEntry = {
    userId: options.userId,
    displayName: options.displayName,
    tier: DEFAULT_TIER,
    productId: null,
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
  const product = room.products[productId];
  if (!product) return null;
  return Y.encodeStateAsUpdate(product.doc);
};

/** only what the client is missing, which is what makes a reconnect cheap */
export const encodeProductDocDiff = (
  room: Room,
  productId: ProductId,
  stateVector: DocStateVector,
): DocUpdate | null => {
  const product = room.products[productId];
  if (!product) return null;
  return Y.encodeStateAsUpdate(product.doc, toDocUpdate(stateVector));
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
  Y.applyUpdate(productIn(room, productId).doc, toDocUpdate(update));
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

/** what everyone on a product is doing, for a client that has just arrived on it */
export const presenceIn = (
  room: Room,
  productId: ProductId,
): Record<UserId, ProductPresence> => room.products[productId]?.presence ?? {};

/**
 * Makes sure the room knows this member is on the product, whether or not they have sent
 * a signal yet. Without it a member who arrives and sits still is indistinguishable from
 * one who is not here at all, both to the peers already on the product and to whoever
 * arrives next.
 */
export const ensurePresence = (
  room: Room,
  productId: ProductId,
  userId: UserId,
): ProductPresence =>
  (productIn(room, productId).presence[userId] ??= emptyProductPresence());

/**
 * Merges one signal into a member's presence, seeding an entry for a member the product
 * has not heard from yet. Partial because each signal owns exactly one field and must
 * leave the rest of what the room knows alone.
 */
export const setPresence = (
  room: Room,
  productId: ProductId,
  userId: UserId,
  patch: Partial<ProductPresence>,
): void => {
  const product = productIn(room, productId);
  const entry = (product.presence[userId] ??= emptyProductPresence());
  Object.assign(entry, patch);
};

/** the drag alone, so the sweep can release one without forgetting where a member is */
export const setDrag = (
  room: Room,
  productId: ProductId,
  userId: UserId,
  elements: DraggedElement[],
  now: number,
): void => {
  setPresence(room, productId, userId, { drag: elements });
  productIn(room, productId).dragTouchedAt[userId] = now;
};

export const clearDrag = (
  room: Room,
  productId: ProductId,
  userId: UserId,
): void => {
  const product = room.products[productId];
  if (!product) return;
  const entry = product.presence[userId];
  if (entry) entry.drag = null;
  delete product.dragTouchedAt[userId];
};

/**
 * @returns whether the server already knows about a drag for this member, which is what
 * separates a move that continues a gesture from one that has to revive it
 */
export const hasDrag = (
  room: Room,
  productId: ProductId,
  userId: UserId,
): boolean => room.products[productId]?.presence[userId]?.drag != null;

/** everything one member was doing on a product, for a departure of any kind */
export const clearPresence = (
  room: Room,
  productId: ProductId,
  userId: UserId,
): void => {
  const product = room.products[productId];
  if (!product) return;
  delete product.presence[userId];
  delete product.dragTouchedAt[userId];
};

export type ExpiredDrag = { productId: ProductId; userId: UserId };

/**
 * Releases every drag nobody has touched lately, which is the backstop for a client that
 * stopped talking without dropping. A live drag is touched on every move, so this only
 * reaches one whose owner has gone quiet.
 *
 * @returns what it released, since each one has to be announced on its own product
 */
export const expireStaleDrags = (
  room: Room,
  now: number,
  staleAfterMs: number,
): ExpiredDrag[] => {
  const expired: ExpiredDrag[] = [];
  for (const [productId, product] of Object.entries(room.products)) {
    for (const [userId, touchedAt] of Object.entries(product.dragTouchedAt)) {
      if (now - touchedAt <= staleAfterMs) continue;
      clearDrag(room, productId, userId);
      expired.push({ productId, userId });
    }
  }
  return expired;
};

/** every live room, held in memory: a redeploy drops all of them, by design */
export type RoomStore = {
  get: (roomId: RoomId) => Room | undefined;
  set: (roomId: RoomId, room: Room) => void;
  /** disband retains nothing */
  delete: (roomId: RoomId) => void;
  has: (roomId: RoomId) => boolean;
  /** every room at once, which only the drag sweep has a use for */
  entries: () => [RoomId, Room][];
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
    entries: () => [...roomIdToRoom.entries()],
  };
};
