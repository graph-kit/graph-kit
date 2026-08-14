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
 * higher frequency and lower stakes than the roster: productId is duplicated because
 * the roster answers "who is here" while presence answers "where exactly, right now".
 * cameraState and cursorPosition have no v1 consumer and are plumbing for later.
 */
export type PresenceEntry = {
  productId: ProductId;
  cursorPosition: Point | null;
  cameraState: CameraState | null;
};

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
