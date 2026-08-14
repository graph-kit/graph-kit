import { nullThrows } from '@core/utils/assert';
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
  RoomMembership,
  RosterEntry,
  UserId,
} from '@multiplayer/protocol/room';
import {
  PatchOp,
  ServerState,
  hashServerState,
} from '@multiplayer/protocol/server-state';
import {
  AssignableTier,
  DEFAULT_TIER,
  Tier,
} from '@multiplayer/protocol/tiers';
import { Socket, io as connect } from 'socket.io-client';

import { ComputedRef, Ref, computed, ref, shallowRef } from 'vue';

import { MultiplayerHostField } from '../product/types.ts';
import { createSyncTracker } from './sync-tracker.ts';

type MultiplayerSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const generatePayloadId = () => crypto.randomUUID();

/** what a url driven join sends until the panel that owns the name mounts and renames */
const UNNAMED_DISPLAY_NAME = '[Unknown]';

const ROOM_QUERY_PARAM = 'room';

const readRoomIdFromUrl = () =>
  new URL(window.location.href).searchParams.get(ROOM_QUERY_PARAM);

const writeRoomIdToUrl = (id: RoomId) => {
  const url = new URL(window.location.href);
  url.searchParams.set(ROOM_QUERY_PARAM, id);
  window.history.replaceState({}, '', url);
};

const stripRoomIdFromUrl = () => {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(ROOM_QUERY_PARAM)) return;
  url.searchParams.delete(ROOM_QUERY_PARAM);
  window.history.replaceState({}, '', url);
};

/**
 * where a mounting product's state came from. 'room' means authoritative state was
 * applied and local restore must not run on top of it.
 */
export type ProductStateSource = 'room' | 'local';

export type RoomActions = {
  /** the display name is supplied per call: the room is not where it is stored */
  start: (options: RoomEntryOptions) => Promise<RoomId>;
  join: (options: RoomEntryOptions & { roomId: RoomId }) => Promise<JoinResult>;
  leave: () => void;
};

export type ProductActions = {
  enter: (
    productId: ProductId,
    host: MultiplayerHostField<any>,
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

  /** a no-op when the change came from the room itself */
  sendOps: (productId: ProductId, ops: PatchOp[]) => void;
  /** overwrites this product's server state with the host's, for changes no op describes */
  sendReplacement: (productId: ProductId) => void;

  isApplyingRemote: () => boolean;

  /** pulls this product's server state back down when local has silently diverged */
  resyncIfDrifted: (productId: ProductId) => void;

  /** ungated by tier, unlike everything above */
  updatePresence: (entry: PresenceEntry) => void;
};

/**
 * The room connection, owned once at the application root. Every product is its own
 * page, so a socket held by a harness would die on each navigation, and a host's would
 * disband their own room every time they switched products.
 */
export const createMultiplayer = (options: {
  serverUrl: string;
  /**
   * how a host driven move becomes a navigation. supplied by the app root because
   * mapping a productId to a url is a client concern the server knows nothing about
   */
  onMovedToProduct?: (productId: ProductId) => void;
}): MultiplayerControls => {
  const { onMovedToProduct } = options;
  const sync = createSyncTracker();

  // read up front rather than discovered on mount, so a product that is about to be
  // handed room state never paints local content first
  const awaitingServerState = ref(readRoomIdFromUrl() !== null);

  // one object rather than loose ids, so a room without a user, or a user without a
  // room, is a state this cannot get into
  const membership = ref<RoomMembership | null>(null);
  const presence = ref<Record<UserId, PresenceEntry>>({});

  // the product currently mounted, and the seam it exposes to us. shallow because the
  // host holds functions and a graph, none of which should be made reactive
  const activeProductId = ref<ProductId | null>(null);
  const activeHost = shallowRef<MultiplayerHostField<any> | null>(null);

  // guards the resync path against re-entering itself, which matters most when a
  // resync fails validation: nothing re-arms, so a bad payload cannot loop
  const resyncInFlight = new Set<ProductId>();

  let socket: MultiplayerSocket | null = null;

  const inRoom = computed(() => membership.value !== null);

  /** for the paths a room already gates, where a missing socket is a broken invariant */
  const requireSocket = () =>
    nullThrows(socket, 'multiplayer: acted on a room with no socket');

  /** the mounted product's own state, in the only shape the room knows */
  const encodeActiveState = () =>
    nullThrows(
      activeHost.value,
      'multiplayer: encoded state with no product mounted',
    ).encode();

  // built once rather than per recompute, so the identity a consumer holds onto stays
  // stable across every roster and presence change
  const roomControls: RoomControls = {
    setTier: (targetId, nextTier) =>
      requireSocket().emit('setTier', { userId: targetId, tier: nextTier }),
    kickUser: (targetId) =>
      requireSocket().emit('kickUser', { userId: targetId }),
    moveUser: (targetId, productId) =>
      requireSocket().emit('moveUser', { userId: targetId, productId }),
    setDisplayName: (displayName) =>
      requireSocket().emit('setDisplayName', { displayName }),
  };

  const room = computed<RoomState>(() => {
    if (membership.value === null) return { connected: false };
    const { roomId, userId, data } = membership.value;

    return {
      connected: true,
      id: roomId,
      userIdToRosterEntry: data.roster,
      userIdToPresence: presence.value,
      me: {
        id: userId,
        // the roster is what grants a tier, so an entry that has not landed yet is
        // the least privileged one rather than a special case
        tier: data.roster[userId]?.tier ?? DEFAULT_TIER,
        isHost: data.hostId === userId,
      },
      controls: roomControls,
    };
  });

  /** the one way room state is taken on, whether the room was opened or joined */
  const adoptMembership = (next: RoomMembership) => {
    membership.value = next;
  };

  const reset = () => {
    awaitingServerState.value = false;
    membership.value = null;
    presence.value = {};
    resyncInFlight.clear();
    sync.clear();
  };

  /**
   * Adopts authoritative state for a product. Returns whether it landed, so callers can
   * tell a refused payload from an applied one without inspecting state themselves.
   */
  const adoptServerState = (options: {
    productId: ProductId;
    state: ServerState;
    version: number;
    stateHash: string;
  }) => {
    const { productId, state, version, stateHash } = options;
    const host = activeHost.value;
    // arriving for a product that is not on screen is normal during navigation, and
    // entering re-fetches, so there is nothing to do and nothing to report
    if (!host || activeProductId.value !== productId) return false;

    if (!host.validate(state)) {
      // an invariant violation, not a network condition: state routed under the wrong
      // productId, or a product encoding a shape it does not own. reported here rather
      // than thrown by the host, since this is the layer that knows the room it came in
      // under, and the layer that must not retry it
      console.error(
        `[multiplayer] refused server state for "${productId}": failed the product's own validation. keys: ${Object.keys(state).join(', ') || '(none)'}`,
      );
      return false;
    }

    sync.applyRemote(() => host.onForceResync(state));
    sync.reset(productId, version, stateHash);
    return true;
  };

  const adoptJoinResult = (productId: ProductId, result: JoinResult) => {
    if (!result.joined) return;

    adoptMembership(result);

    // absent when nobody has opened this product in the room yet, which is not a
    // failure: the first write from here creates it
    if (!result.serverState) {
      sync.forget(productId);
      return;
    }

    adoptServerState({ productId, ...result.serverState });
  };

  const requestResync = (productId: ProductId) => {
    if (!socket || resyncInFlight.has(productId)) return;

    resyncInFlight.add(productId);
    socket.emit('requestServerState', { productId }, (result) => {
      resyncInFlight.delete(productId);
      if (!result.joined || !result.serverState) return;
      // a refusal here is terminal on purpose. re-requesting would fetch the same
      // payload and refuse it again, so the console error is the end of the line
      adoptServerState({ productId, ...result.serverState });
    });
  };

  const attachHandlers = (activeSocket: MultiplayerSocket) => {
    activeSocket.on('rosterChanged', (data) => {
      // a roster can land in the gap between a kick or a disband and this socket
      // hearing about it, and there is no room left for it to describe
      if (!membership.value) return;
      membership.value = { ...membership.value, data };
    });

    activeSocket.on('presenceChanged', ({ userId: peerId, entry }) => {
      presence.value = { ...presence.value, [peerId]: entry };
    });

    activeSocket.on('serverStatePatched', (relay) => {
      const verdict = sync.verdictFor(relay.productId, relay.version);
      if (verdict === 'ignore') return;
      if (verdict === 'resync') return requestResync(relay.productId);

      const host = activeHost.value;
      if (!host || activeProductId.value !== relay.productId) return;

      // ops are applied by whatever the product registered; the version only advances
      // once that succeeds, so a throwing applier leaves a gap the next relay catches
      sync.applyRemote(() => host.applyOps(relay.ops));
      sync.recordApplied(relay.productId, relay.version, relay.stateHash);
    });

    activeSocket.on('serverStateReplaced', (relay) => {
      // authoritative by definition, so it never consults the counter
      adoptServerState(relay);
    });

    // the room is gone, so the id in the url is dead. strip it and carry on locally,
    // with no error state: the same quiet fallback a bad id gets on the way in
    activeSocket.on('roomDisbanded', () => {
      stripRoomIdFromUrl();
      reset();
    });
    activeSocket.on('kicked', () => {
      stripRoomIdFromUrl();
      reset();
    });

    activeSocket.on('movedToProduct', ({ productId }) => {
      // productId only, never a route: turning it into one is a client concern, and
      // the mounting product then registers for its own state as on any navigation
      onMovedToProduct?.(productId);
    });
  };

  const ensureSocket = () => {
    if (socket) return socket;
    socket = connect(options.serverUrl, { transports: ['websocket'] });
    attachHandlers(socket);
    return socket;
  };

  // once for the life of the connection, not per mount
  let roomResolutionAttempted = false;

  const roomActions: RoomActions = {
    start: async ({ productId, displayName }) => {
      const activeSocket = ensureSocket();
      // the host's current view becomes the seed, so the first frame after starting
      // matches the last frame before it
      const state = encodeActiveState();
      const started = await new Promise<RoomMembership>((resolve) => {
        activeSocket.emit(
          'startRoom',
          { displayName, productId, state },
          resolve,
        );
      });

      adoptMembership(started);
      sync.reset(productId, 1, hashServerState(state));

      // the id becomes shareable the moment the room exists, and survives a refresh
      writeRoomIdToUrl(started.roomId);

      // nothing to resolve later: this connection is already in its room
      roomResolutionAttempted = true;
      return started.roomId;
    },

    join: async ({ roomId, productId, displayName }) => {
      const activeSocket = ensureSocket();
      const result = await new Promise<JoinResult>((resolve) => {
        activeSocket.emit(
          'joinRoom',
          { roomId, displayName, productId },
          resolve,
        );
      });

      adoptJoinResult(productId, result);
      return result;
    },

    leave: () => {
      socket?.disconnect();
      socket = null;
      reset();
    },
  };

  const productActions: ProductActions = {
    // one call covers the roster update, the traffic routing and the initial state
    enter: async (productId, host) => {
      activeProductId.value = productId;
      activeHost.value = host;

      // resolution happens once for the life of the connection rather than per mount,
      // so navigating between products never re-reads the url or re-joins
      if (!roomResolutionAttempted) {
        roomResolutionAttempted = true;
        const targetRoomId = readRoomIdFromUrl();

        if (targetRoomId) {
          try {
            // no name to hand over yet: the panel that owns it has not mounted, so the
            // room holds the placeholder until it renames through room.controls
            const result = await roomActions.join({
              roomId: targetRoomId,
              productId,
              displayName: UNNAMED_DISPLAY_NAME,
            });
            if (result.joined) return 'room';

            // a dead room id is a non event: strip it and carry on exactly as if the
            // param had never been there, with no error surfaced
            stripRoomIdFromUrl();
            return 'local';
          } finally {
            awaitingServerState.value = false;
          }
        }

        awaitingServerState.value = false;
      }

      // the ordinary outcome for every page load outside a room, and the answer the
      // harness needs before it restores anything local
      if (!inRoom.value) return 'local';

      // being in a room without a socket is a broken invariant rather than a reason
      // to quietly fall back to local
      const activeSocket = requireSocket();

      // navigating inside a room waits too: the new product mounts empty and the
      // server is what fills it
      awaitingServerState.value = true;
      try {
        const result = await new Promise<JoinResult>((resolve) => {
          activeSocket.emit('enterProduct', { productId }, resolve);
        });
        adoptJoinResult(productId, result);
        return 'room';
      } finally {
        awaitingServerState.value = false;
      }
    },

    /** on unmount. the connection, the room and the roster all outlive this */
    leave: (productId) => {
      if (activeProductId.value !== productId) return;
      activeProductId.value = null;
      activeHost.value = null;
    },
  };

  return {
    actions: {
      room: roomActions,
      product: productActions,
    },

    room,

    awaitingServerState,

    sendOps: (productId: ProductId, ops: PatchOp[]) => {
      if (!socket || !inRoom.value) return;
      if (sync.isApplyingRemote()) return;
      if (ops.length === 0) return;

      socket.emit('patchServerState', {
        payloadId: generatePayloadId(),
        productId,
        ops,
      });
    },

    /** wholesale override, behind seeding, force push and undo */
    sendReplacement: (productId: ProductId) => {
      if (!socket || !inRoom.value) return;
      if (sync.isApplyingRemote()) return;

      socket.emit('replaceServerState', {
        payloadId: generatePayloadId(),
        productId,
        state: encodeActiveState(),
      });
    },

    isApplyingRemote: sync.isApplyingRemote,

    resyncIfDrifted: (productId: ProductId) => {
      if (!inRoom.value) return;
      if (!sync.hasDrifted(productId, hashServerState(encodeActiveState())))
        return;

      console.warn(
        `[multiplayer] local state for "${productId}" diverged from the room despite an unbroken version sequence, resyncing`,
      );
      requestResync(productId);
    },

    // optional chained where the room controls are not: presence is broadcast off the
    // command path, by a product that may never have opened a socket at all
    updatePresence: (entry: PresenceEntry) =>
      socket?.emit('updatePresence', entry),
  };
};
