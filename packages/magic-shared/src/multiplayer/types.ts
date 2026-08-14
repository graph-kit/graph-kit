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

/**
 * where a mounting product's state came from. 'room' means authoritative state was
 * applied and local restore must not run on top of it.
 */
export type ProductStateSource = 'room' | 'local';

export type MultiplayerSocket = Socket<
  ServerToClientEvents,
  ClientToServerEvents
>;

export type RoomActions = {
  /** the display name is supplied per call: the room is not where it is stored */
  start: (options: RoomEntryOptions) => Promise<RoomId>;
  join: (options: RoomEntryOptions & { roomId: RoomId }) => Promise<JoinResult>;
  leave: () => void;
};

export type ProductActions = {
  enter: (
    productId: ProductId,
    host: MultiplayerHostField,
  ) => Promise<ProductStateSource>;
  leave: (productId: ProductId) => void;
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
