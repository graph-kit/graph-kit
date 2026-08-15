import {
  ClientToServerEvents,
  JoinResult,
  RoomEntryOptions,
  ServerToClientEvents,
} from '@multiplayer/protocol/events';
import {
  PresenceEntry,
  ProductId,
  RoomId,
  RosterEntry,
  UserId,
} from '@multiplayer/protocol/room';
import { AssignableTier, Tier } from '@multiplayer/protocol/tiers';
import { Socket } from 'socket.io-client';

import { ComputedRef, Ref } from 'vue';

import { MultiplayerHostField } from '../product/types.ts';

export type MultiplayerSocket = Socket<
  ServerToClientEvents,
  ClientToServerEvents
>;

/** what a room needs from the product it opens on, supplied by the harness */
export type ProductBinding = {
  productId: ProductId;
  host: MultiplayerHostField;
};

export type RoomActions = {
  /** the display name is supplied per call: the room is not where it is stored */
  start: (options: RoomEntryOptions & ProductBinding) => Promise<RoomId>;
  join: (
    options: RoomEntryOptions & ProductBinding & { roomId: RoomId },
  ) => Promise<JoinResult>;
  leave: () => void;
};

export type ProductActions = {
  /** for a product mounting into a room this connection already belongs to */
  enter: (options: ProductBinding) => Promise<void>;
  leave: (productId: ProductId) => void;
};

/**
 * the product facing surface. the harness knows its own product and host, so a caller
 * supplies nothing but who is arriving.
 */
export type ProductMultiplayer = {
  room: {
    state: ComputedRef<RoomState>;
    start: (options: RoomEntryOptions) => Promise<RoomId>;
    join: (
      options: RoomEntryOptions & { roomId: RoomId },
    ) => Promise<JoinResult>;
    leave: () => void;
  };

  /** true while the server is about to say what this product should show */
  awaitingServerState: Ref<boolean>;
};

export type Me = {
  id: UserId;
  tier: Tier;
  isHost: boolean;
};

export type RoomControls = {
  setTier: (targetId: UserId, nextTier: AssignableTier) => void;
  kickUser: (targetId: UserId) => void;
  /** sends a productId; the client turns it into a navigation */
  moveUser: (targetId: UserId, productId: ProductId) => void;
  /** renaming mid session, which is what makes an unnamed join recoverable */
  setDisplayName: (displayName: string) => void;
  updatePresence: (entry: PresenceEntry) => void;
};

export type RoomState =
  | { connected: false }
  | {
      connected: true;
      id: RoomId;
      userIdToRosterEntry: Record<UserId, RosterEntry>;
      userIdToPresence: Record<UserId, PresenceEntry>;
      me: Me;
      controls: RoomControls;
    };

export type MultiplayerControls = {
  actions: {
    room: RoomActions;
    product: ProductActions;
  };

  room: ComputedRef<RoomState>;

  /** true while the server is about to say what this product should show */
  awaitingServerState: Ref<boolean>;
};
