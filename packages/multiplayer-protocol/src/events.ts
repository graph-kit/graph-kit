import {
  PresenceEntry,
  ProductId,
  RoomData,
  RoomId,
  UserId,
} from './room.ts';
import {
  PatchOp,
  PayloadId,
  ServerStatePatchRelay,
  ServerStateReplaceRelay,
  ServerState,
} from './server-state.ts';
import { AssignableTier } from './tiers.ts';

/**
 * a dead room id is a non event rather than an error, so resolution returns a result
 * the client can quietly fall through on instead of throwing
 */
export type JoinResult =
  | { joined: false }
  | {
      joined: true;
      roomId: RoomId;
      userId: UserId;
      data: RoomData;
      /** absent when nobody has opened this product in the room yet */
      serverState: { state: ServerState; version: number; stateHash: string } | null;
    };

export type ClientToServerEvents = {
  startRoom: (
    options: {
      displayName: string;
      productId: ProductId;
      state: ServerState;
    },
    callback: (roomId: RoomId, userId: UserId, data: RoomData) => void,
  ) => void;

  joinRoom: (
    options: {
      roomId: RoomId;
      displayName: string;
      productId: ProductId;
    },
    callback: (result: JoinResult) => void,
  ) => void;

  /**
   * reports that this user navigated, which the server cannot derive on its own. server state
   * traffic is routed off the roster from here, so there is no subscription to manage.
   * kept separate from requestServerState because entering is a roster change every client
   * should hear about, while a resync is private to the one client that drifted.
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
