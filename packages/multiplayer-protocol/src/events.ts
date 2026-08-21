import { DocStateVector, DocUpdate } from './doc.ts';
import {
  CameraState,
  DraggedElement,
  Point,
  ProductId,
  ProductPresence,
  RoomData,
  RoomId,
  RoomMembership,
  RosterEntry,
  Seat,
  UserId,
} from './room.ts';
import { AssignableTier } from './tiers.ts';

/**
 * a dead room id is a non event rather than an error, so resolution returns a result
 * the client can quietly fall through on instead of throwing
 */
export type JoinResult =
  { joined: false } | (RoomMembership & { joined: true });

/** who is arriving, which is all a room needs to admit someone */
export type RoomEntryOptions = {
  displayName: string;
};

export type ClientToServerEvents = {
  startRoom: (
    options: RoomEntryOptions & { productId: ProductId; doc: DocUpdate },
    callback: (membership: RoomMembership) => void,
  ) => void;

  /**
   * A seat is claimed rather than requested: the server admits the claim only for a seat
   * that exists, matches the token and has nobody sitting in it, and quietly seats the
   * arrival somewhere new otherwise. A client cannot know which of those happened before
   * it asks, so both cases answer with the same result and the identity it must adopt.
   */
  joinRoom: (
    options: RoomEntryOptions & { roomId: RoomId; seat?: Seat },
    callback: (result: JoinResult) => void,
  ) => void;

  /**
   * Departure that was chosen, which a dropped connection is not. Without it the server
   * cannot tell somebody who is done with a room from somebody whose train went into a
   * tunnel, and would have to guess which of the two should keep their seat.
   */
  leaveRoom: () => void;

  /**
   * Reports that this user navigated, which the server cannot derive. Separate from
   * syncDoc because entering is a roster change everyone hears about. Answers with the
   * product's document, absent when nobody in the room has opened it yet.
   */
  enterProduct: (
    options: { productId: ProductId },
    callback: (state: ProductEntryState) => void,
  ) => void;

  /**
   * Unmounting a product without leaving the room. The server cannot derive this, and
   * without it a departed member keeps their presence, and any drag, on a product they
   * are no longer looking at.
   */
  leaveProduct: (options: { productId: ProductId }) => void;

  /**
   * One product's local changes. Merged into the server's copy and relayed, with no
   * ordering or acknowledgement, since applying these twice or out of order is a no-op.
   */
  docUpdate: (options: { productId: ProductId; update: DocUpdate }) => void;

  /**
   * Asks for everything this client is missing. Answered with a single update rather
   * than whole state, so reconnecting costs the diff instead of the document.
   */
  syncDoc: (
    options: { productId: ProductId; stateVector: DocStateVector },
    callback: (update: DocUpdate | null) => void,
  ) => void;

  /**
   * renaming yourself, at any point. ungated: a display name is a local convenience
   * value tied to no account, so there is nothing to authorize. being able to fix it
   * mid session is what removes the need to gate room creation on setting one first
   */
  setDisplayName: (options: { displayName: string }) => void;

  setTier: (options: { userId: UserId; tier: AssignableTier }) => void;
  kickUser: (options: { userId: UserId }) => void;
  moveUser: (options: { userId: UserId; productId: ProductId }) => void;

  /**
   * Presence, one event per signal. All ungated, all high frequency, all deliberately
   * off the command path, and all scoped to the product channel: what a user is doing
   * means nothing to somebody looking at a different product.
   */
  moveCursor: (options: { position: Point | null }) => void;
  moveCamera: (options: { camera: CameraState }) => void;
  setAnnotating: (options: { isAnnotating: boolean }) => void;

  /**
   * A drag as a lifecycle rather than a field that empties, so peers can listen for the
   * moment one begins and ends instead of diffing for it. `updateDrag` for a user with
   * no drag on record is promoted to a start, which is what lets the staleness sweep
   * release a drag without the gesture being lost for good if it guessed early.
   */
  startDrag: (options: { elements: DraggedElement[] }) => void;
  updateDrag: (options: { elements: DraggedElement[] }) => void;
  endDrag: () => void;
};

/**
 * Everything a product needs on arrival: the document to adopt, absent when nobody has
 * opened this product in the room yet, and what everyone already on it is doing.
 */
export type ProductEntryState = {
  doc: DocUpdate | null;
  presence: Record<UserId, ProductPresence>;
};

export type ServerToClientEvents = {
  /** a peer's changes, or the server's answer to a reconnect */
  docUpdated: (options: { productId: ProductId; update: DocUpdate }) => void;

  rosterChanged: (data: RoomData) => void;

  /** presence, mirroring the client signals one for one */
  cursorMoved: (options: { userId: UserId; position: Point | null }) => void;
  cameraMoved: (options: { userId: UserId; camera: CameraState }) => void;
  annotatingChanged: (options: {
    userId: UserId;
    isAnnotating: boolean;
  }) => void;

  dragStarted: (options: {
    userId: UserId;
    elements: DraggedElement[];
  }) => void;
  dragMoved: (options: { userId: UserId; elements: DraggedElement[] }) => void;
  dragEnded: (options: { userId: UserId }) => void;

  /**
   * this user is on the product now. announced rather than left to be inferred from
   * their first signal, so somebody who has arrived and not moved yet is still known
   * to be here. carries their presence for symmetry with the entry payload, which is
   * empty on a first arrival and is whatever the room kept for them otherwise
   */
  peerEnteredProduct: (options: {
    userId: UserId;
    presence: ProductPresence;
  }) => void;

  /**
   * this user is no longer on the product, whether they navigated, disconnected or were
   * kicked. the one signal that clears a peer wholesale, drag included
   */
  peerLeftProduct: (options: { userId: UserId }) => void;

  /**
   * Sent to the one member being moved, never the room. Carries a productId and never a
   * route, which stays a client concern, and the mover, since arriving somewhere you did
   * not ask for is only sensible with a name attached to it.
   */
  movedToProduct: (options: { productId: ProductId; by: RosterEntry }) => void;

  /**
   * The last thing this connection hears from the room. Carries the kicker because the
   * target is already off the roster by the time it lands, so nothing on the client can
   * still resolve a user id into a person.
   */
  kicked: (options: { by: RosterEntry }) => void;

  /**
   * The room is gone and every seat in it with it. A union rather than a flag so a third
   * cause has to be answered for at the handler instead of falling through as a host
   * leaving, which is the one a client would otherwise assume.
   */
  roomDisbanded: (options: { reason: DisbandReason }) => void;
};

/**
 * `hostLeft` is chosen and immediate; `inactivity` is the room timing out, which can
 * happen to members who are still connected and simply idle
 */
export type DisbandReason = 'hostLeft' | 'inactivity';
