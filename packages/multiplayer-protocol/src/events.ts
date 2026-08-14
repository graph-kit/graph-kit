import {
  PresenceEntry,
  ProductId,
  RoomData,
  RoomId,
  RoomMembership,
  UserId,
} from './room.ts';
import {
  PatchOp,
  PayloadId,
  ServerState,
  ServerStatePatchRelay,
  ServerStateReplaceRelay,
} from './server-state.ts';
import { AssignableTier } from './tiers.ts';

/**
 * a dead room id is a non event rather than an error, so resolution returns a result
 * the client can quietly fall through on instead of throwing
 */
export type JoinResult =
  | { joined: false }
  | (RoomMembership & {
      joined: true;
      /** absent when nobody has opened this product in the room yet */
      serverState: {
        state: ServerState;
        version: number;
        stateHash: string;
      } | null;
    });

/** what both ways into a room carry: the product it opens on, and who is arriving */
export type RoomEntryOptions = {
  productId: ProductId;
  displayName: string;
};

export type ClientToServerEvents = {
  startRoom: (
    options: RoomEntryOptions & { state: ServerState },
    callback: (membership: RoomMembership) => void,
  ) => void;

  joinRoom: (
    options: RoomEntryOptions & { roomId: RoomId },
    callback: (result: JoinResult) => void,
  ) => void;

  /**
   * Reports that this user navigated, which the server cannot derive. Separate from
   * requestServerState because entering is a roster change everyone hears about.
   */
  enterProduct: (
    options: { productId: ProductId },
    callback: (result: JoinResult) => void,
  ) => void;

  patchServerState: (options: {
    payloadId: PayloadId;
    productId: ProductId;
    ops: PatchOp[];
  }) => void;

  /** wholesale override behind room seeding, lazy creation, force push and undo */
  replaceServerState: (options: {
    payloadId: PayloadId;
    productId: ProductId;
    state: ServerState;
  }) => void;

  /** drift resync, answered with the same payload shape a join gets */
  requestServerState: (
    options: { productId: ProductId },
    callback: (result: JoinResult) => void,
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
  serverStatePatched: (relay: ServerStatePatchRelay) => void;
  serverStateReplaced: (relay: ServerStateReplaceRelay) => void;

  rosterChanged: (data: RoomData) => void;
  presenceChanged: (options: { userId: UserId; entry: PresenceEntry }) => void;

  /** carries productId only, never a route, which stays a client concern */
  movedToProduct: (options: { productId: ProductId }) => void;

  kicked: () => void;
  roomDisbanded: () => void;
};
