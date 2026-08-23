import { ReadonlyEventHub } from '@core/events/createEventHub';
import {
  ClientToServerEvents,
  JoinResult,
  ServerToClientEvents,
} from '@multiplayer/protocol/events';
import {
  CameraState,
  DraggedElement,
  PeerStroke,
  Point,
  ProductId,
  ProductPresence,
  RoomId,
  RosterEntry,
  UserId,
} from '@multiplayer/protocol/room';
import { AssignableTier, Tier } from '@multiplayer/protocol/tiers';
import { Socket } from 'socket.io-client';

import { ComputedRef } from 'vue';

import { ComponentControls } from '../component-slot/useComponent.ts';
import { MultiplayerHostField } from '../product/types.ts';
import { MultiplayerEventMap } from './events.ts';

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
  start: (options: ProductBinding) => Promise<RoomId>;
  join: (options: { roomId: RoomId }) => Promise<JoinResult>;
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
    start: () => Promise<RoomId>;
    join: (options: { roomId: RoomId }) => Promise<JoinResult>;
    leave: () => void;
    /**
     * the user holds a tier below what writing takes, so everything that would
     * write stands down. false outside a room, since a tier is only a room's to grant
     */
    isReadonly: ComputedRef<boolean>;
  };

  /** room lifecycle, for anything that should only exist while a room does */
  events: ReadonlyEventHub<MultiplayerEventMap>;

  /** the chrome a room brings with it, which lives and dies with the room */
  ui: {
    rosterPanel: ComponentControls;
    joinBanner: ComponentControls;
  };
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

  /**
   * Presence, one call per signal, each landing on the product this client is on. Split
   * so a drag travels on its own cadence instead of waiting for a cursor to move.
   */
  presence: {
    moveCursor: (position: Point | null) => void;
    moveCamera: (camera: CameraState) => void;
    setAnnotating: (isAnnotating: boolean) => void;
    startDrag: (elements: DraggedElement[]) => void;
    updateDrag: (elements: DraggedElement[]) => void;
    endDrag: () => void;
    startStroke: (stroke: PeerStroke) => void;
    /** only the points added since the last call, never the whole stroke */
    extendStroke: (points: Point[]) => void;
    endStroke: () => void;
  };
};

export type RoomState =
  | { connected: false }
  | {
      connected: true;
      id: RoomId;
      userIdToRosterEntry: Record<UserId, RosterEntry>;
      /** peers on the product this client is on, and only them */
      userIdToPresence: Record<UserId, ProductPresence>;
      me: Me;
      controls: RoomControls;
    };

export type MultiplayerControls = {
  actions: {
    room: RoomActions;
    product: ProductActions;
  };

  room: ComputedRef<RoomState>;

  events: ReadonlyEventHub<MultiplayerEventMap>;
};
