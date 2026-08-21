import { Tier } from './tiers.ts';

export type RoomId = string;

/** fresh per connection in v1, deliberately not durable, see the identity model */
export type UserId = string;

/**
 * a plain string on the wire: the server routes by it without needing the client's
 * literal union of manifest keys, which the client narrows to ProductId at its boundary
 */
export type ProductId = string;

export type RosterEntry = {
  userId: UserId;
  displayName: string;
  tier: Tier;
  /** null between joining a room and mounting the first product */
  productId: ProductId | null;
};

export type Point = { x: number; y: number };

/**
 * matches the canvas surface camera shape verbatim, which is also what the canvas
 * plugin's transit encodes, so presence never needs a translation layer
 */
export type CameraState = { panX: number; panY: number; zoom: number };

/**
 * what a peer is moving right now, ahead of any document write. the id is whatever the
 * product calls the thing being moved, which the room never has to understand.
 */
export type DraggedElement = {
  id: string;
  position: Point;
};

/**
 * What a user is doing inside one product right now. Scoped to the product channel it
 * travels on, which is why nothing here names a productId, and persisted by the room so
 * that entering a product hands over everyone's live state instead of leaving a client
 * to wait for each peer to move before it learns they are there.
 */
export type ProductPresence = {
  cursorPosition: Point | null;
  cameraState: CameraState | null;
  /**
   * in flight and deliberately not in the document: a drag settles into one committed
   * move, and replaying every frame of it would be a write per frame. plural because one
   * gesture can carry a whole selection, and null whenever nothing is being moved
   */
  drag: DraggedElement[] | null;
  /** the annotation tools are taking input, which is not the same as a stroke being in flight */
  isAnnotating: boolean;
};

/** what a user is presumed to be doing before they have sent a single signal */
export const emptyProductPresence = (): ProductPresence => ({
  cursorPosition: null,
  cameraState: null,
  drag: null,
  isAnnotating: false,
});

export type RoomData = {
  hostId: UserId;
  roster: Record<UserId, RosterEntry>;
};

/**
 * who you are and which room you are in, identical whether you opened the room or
 * joined one. named because every path that puts a client in a room hands back exactly
 * this, and a client holding one of the three without the others is a broken state
 */
export type RoomMembership = {
  roomId: RoomId;
  userId: UserId;
  data: RoomData;
};
