import {
  ClientToServerEvents,
  JoinResult,
  ServerToClientEvents,
} from '@multiplayer/protocol/events';
import {
  PresenceEntry,
  ProductId,
  RoomData,
  RoomId,
  RosterEntry,
  UserId,
} from '@multiplayer/protocol/room';
import {
  PatchOp,
  ServerState,
  hashServerState,
} from '@multiplayer/protocol/server-state';
import { AssignableTier, Tier } from '@multiplayer/protocol/tiers';
import { useLocalStorage } from '@vueuse/core';
import { Socket, io as connect } from 'socket.io-client';

import { computed, ref, shallowRef } from 'vue';

import { MultiplayerHostField } from '../product/types.ts';
import { createSyncTracker } from './sync-tracker.ts';

type MultiplayerSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const generatePayloadId = () => crypto.randomUUID();

const emptyRoomData = (): RoomData => ({ hostId: '', roster: {} });

const ROOM_QUERY_PARAM = 'room';

const readRoomIdFromUrl = () =>
  new URL(window.location.href).searchParams.get(ROOM_QUERY_PARAM);

/**
 * only on the way out. unlike the link share payload, a live room id is meant to
 * survive a refresh and stay copyable, so it is stripped when the room is gone rather
 * than when it is consumed
 */
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

/**
 * The room connection, owned once at the application root. Every product is its own
 * page, so a socket held by a product's harness would die on each navigation, and a
 * host's would disband their own room every time they switched products.
 *
 * A mounting product registers itself here and deregisters on unmount. It never owns a
 * connection, a subscription or any room state.
 */
export const createMultiplayer = (options: {
  serverUrl: string;
  /**
   * how a host driven move becomes a navigation. supplied by the app root because
   * mapping a productId to a url is a client concern the server knows nothing about
   */
  onMovedToProduct?: (productId: ProductId) => void;
}) => {
  const { onMovedToProduct } = options;
  const sync = createSyncTracker();

  // a local convenience value, never validated by any server and not tied to an
  // account. the UI gates room creation and joining on it being set, so the fallback
  // is only reachable by pasting a room link with nothing in storage
  const displayName = useLocalStorage('multiplayer-display-name', '');
  const displayNameOrFallback = () => displayName.value.trim() || '[Unknown]';

  const connected = ref(false);
  const roomId = ref<RoomId | null>(null);
  const userId = ref<UserId | null>(null);
  const roomData = ref<RoomData>(emptyRoomData());
  const presence = ref<Record<UserId, PresenceEntry>>({});

  // the product currently mounted, and the seam it exposes to us. shallow because the
  // host holds functions and a graph, none of which should be made reactive
  const activeProductId = ref<ProductId | null>(null);
  const activeHost = shallowRef<MultiplayerHostField<any> | null>(null);

  // guards the resync path against re-entering itself, which matters most when a
  // resync fails validation: nothing re-arms, so a bad payload cannot loop
  const resyncInFlight = new Set<ProductId>();

  let socket: MultiplayerSocket | null = null;

  const roster = computed<RosterEntry[]>(() =>
    Object.values(roomData.value.roster),
  );

  const inRoom = computed(() => roomId.value !== null);

  const tier = computed<Tier | null>(() => {
    const id = userId.value;
    if (id === null) return null;
    return roomData.value.roster[id]?.tier ?? null;
  });

  const isHost = computed(
    () => userId.value !== null && roomData.value.hostId === userId.value,
  );

  const reset = () => {
    roomId.value = null;
    userId.value = null;
    roomData.value = emptyRoomData();
    presence.value = {};
    resyncInFlight.clear();
    sync.clear();
  };

  /**
   * Adopts authoritative state for a product. Returns whether it landed, so callers can
   * tell a refused payload from an applied one without inspecting state themselves.
   */
  const adoptServerState = (
    productId: ProductId,
    state: ServerState,
    version: number,
    stateHash: string,
  ) => {
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

    roomId.value = result.roomId;
    userId.value = result.userId;
    roomData.value = result.data;

    // absent when nobody has opened this product in the room yet, which is not a
    // failure: the first write from here creates it
    if (!result.serverState) {
      sync.forget(productId);
      return;
    }

    adoptServerState(
      productId,
      result.serverState.state,
      result.serverState.version,
      result.serverState.stateHash,
    );
  };

  const requestResync = (productId: ProductId) => {
    if (!socket || resyncInFlight.has(productId)) return;

    resyncInFlight.add(productId);
    socket.emit('requestServerState', { productId }, (result) => {
      resyncInFlight.delete(productId);
      if (!result.joined || !result.serverState) return;
      // a refusal here is terminal on purpose. re-requesting would fetch the same
      // payload and refuse it again, so the console error is the end of the line
      adoptServerState(
        productId,
        result.serverState.state,
        result.serverState.version,
        result.serverState.stateHash,
      );
    });
  };

  const attachHandlers = (activeSocket: MultiplayerSocket) => {
    activeSocket.on('connect', () => (connected.value = true));
    activeSocket.on('disconnect', () => (connected.value = false));

    activeSocket.on('rosterChanged', (data) => (roomData.value = data));

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
      adoptServerState(
        relay.productId,
        relay.state,
        relay.version,
        relay.stateHash,
      );
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

  const joinRoomInternal = async (
    targetRoomId: RoomId,
    productId: ProductId,
  ) => {
    const activeSocket = ensureSocket();
    const result = await new Promise<JoinResult>((resolve) => {
      activeSocket.emit(
        'joinRoom',
        {
          roomId: targetRoomId,
          displayName: displayNameOrFallback(),
          productId,
        },
        resolve,
      );
    });

    adoptJoinResult(productId, result);
    return result;
  };

  return {
    connected,
    inRoom,
    roomId,
    userId,
    roster,
    presence,
    tier,
    isHost,

    /**
     * Registers the mounting product and reports the navigation to the server, which
     * routes its traffic off the roster from here. One call covers the roster update,
     * the routing and the initial state.
     *
     * Reports where the product's state came from, because the caller has to know
     * whether to run its local restore: a room's state must not be painted over by
     * localStorage, and only this call knows whether a room answered.
     */
    enterProduct: async (
      productId: ProductId,
      host: MultiplayerHostField<any>,
    ): Promise<ProductStateSource> => {
      activeProductId.value = productId;
      activeHost.value = host;

      // resolution happens once for the life of the connection rather than per mount,
      // so navigating between products never re-reads the url or re-joins
      if (!roomResolutionAttempted) {
        roomResolutionAttempted = true;
        const targetRoomId = readRoomIdFromUrl();

        if (targetRoomId) {
          const result = await joinRoomInternal(targetRoomId, productId);
          if (result.joined) return 'room';

          // a dead room id is a non event: strip it and carry on exactly as if the
          // param had never been there, with no error surfaced
          stripRoomIdFromUrl();
          return 'local';
        }
      }

      const activeSocket = socket;
      if (!activeSocket || !inRoom.value) return 'local';

      const result = await new Promise<JoinResult>((resolve) => {
        activeSocket.emit('enterProduct', { productId }, resolve);
      });
      adoptJoinResult(productId, result);
      return 'room';
    },

    /** on unmount. the connection, the room and the roster all outlive this */
    leaveProduct: (productId: ProductId) => {
      if (activeProductId.value !== productId) return;
      activeProductId.value = null;
      activeHost.value = null;
    },

    startRoom: async (productId: ProductId, state: ServerState) => {
      const activeSocket = ensureSocket();
      const started = await new Promise<{
        roomId: RoomId;
        userId: UserId;
        data: RoomData;
      }>((resolve) => {
        activeSocket.emit(
          'startRoom',
          { displayName: displayNameOrFallback(), productId, state },
          (id, user, data) => resolve({ roomId: id, userId: user, data }),
        );
      });

      roomId.value = started.roomId;
      userId.value = started.userId;
      roomData.value = started.data;
      sync.reset(productId, 1, hashServerState(state));

      // the id becomes shareable the moment the room exists, and survives a refresh
      const url = new URL(window.location.href);
      url.searchParams.set(ROOM_QUERY_PARAM, started.roomId);
      window.history.replaceState({}, '', url);

      // nothing to resolve later: this connection is already in its room
      roomResolutionAttempted = true;
      return started.roomId;
    },

    joinRoom: joinRoomInternal,

    displayName,

    /** outbound. no-op when suspended or when this change came from the room itself */
    sendOps: (productId: ProductId, ops: PatchOp[]) => {
      if (!socket || !inRoom.value) return;
      if (sync.isApplyingRemote() || sync.isSuspended(productId)) return;
      if (ops.length === 0) return;

      socket.emit('patchServerState', {
        payloadId: generatePayloadId(),
        productId,
        ops,
      });
    },

    /** wholesale override, behind seeding, force push and undo */
    sendReplacement: (productId: ProductId, state: ServerState) => {
      if (!socket || !inRoom.value) return;
      if (sync.isApplyingRemote()) return;

      socket.emit('replaceServerState', {
        payloadId: generatePayloadId(),
        productId,
        state,
      });
    },

    suspend: sync.suspend,
    resume: sync.resume,
    isSuspended: sync.isSuspended,
    isApplyingRemote: sync.isApplyingRemote,

    /**
     * Reports a freshly computed local hash so it can be compared against what the
     * server last said. Catches the case the version counter cannot: the same number
     * of applies landing on different state.
     */
    reportLocalHash: (productId: ProductId, localHash: string) => {
      if (!inRoom.value || sync.isSuspended(productId)) return;
      if (!sync.hasDrifted(productId, localHash)) return;

      console.warn(
        `[multiplayer] local state for "${productId}" diverged from the room despite an unbroken version sequence, resyncing`,
      );
      requestResync(productId);
    },

    setTier: (targetId: UserId, nextTier: AssignableTier) =>
      socket?.emit('setTier', { userId: targetId, tier: nextTier }),
    kickUser: (targetId: UserId) =>
      socket?.emit('kickUser', { userId: targetId }),
    moveUser: (targetId: UserId, productId: ProductId) =>
      socket?.emit('moveUser', { userId: targetId, productId }),
    updatePresence: (entry: PresenceEntry) =>
      socket?.emit('updatePresence', entry),

    disconnect: () => {
      socket?.disconnect();
      socket = null;
      reset();
    },
  };
};

export type MultiplayerControls = ReturnType<typeof createMultiplayer>;
