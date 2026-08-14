import { DocStateVector, DocUpdate } from './doc.ts';
import {
  PresenceEntry,
  ProductId,
  RoomData,
  RoomId,
  RoomMembership,
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

  joinRoom: (
    options: RoomEntryOptions & { roomId: RoomId },
    callback: (result: JoinResult) => void,
  ) => void;

  /**
   * Reports that this user navigated, which the server cannot derive. Separate from
   * syncDoc because entering is a roster change everyone hears about. Answers with the
   * product's document, absent when nobody in the room has opened it yet.
   */
  enterProduct: (
    options: { productId: ProductId },
    callback: (doc: DocUpdate | null) => void,
  ) => void;

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

  /** ungated and high frequency, deliberately off the command path */
  updatePresence: (entry: PresenceEntry) => void;
};

export type ServerToClientEvents = {
  /** a peer's changes, or the server's answer to a reconnect */
  docUpdated: (options: { productId: ProductId; update: DocUpdate }) => void;

  rosterChanged: (data: RoomData) => void;
  presenceChanged: (options: { userId: UserId; entry: PresenceEntry }) => void;

  /** carries productId only, never a route, which stays a client concern */
  movedToProduct: (options: { productId: ProductId }) => void;

  kicked: () => void;
  roomDisbanded: () => void;
};
