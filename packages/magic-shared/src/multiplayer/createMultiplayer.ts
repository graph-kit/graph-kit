import { nullThrows } from '@core/utils/assert';
import { DocUpdate, toDocUpdate } from '@multiplayer/protocol/doc';
import { JoinResult } from '@multiplayer/protocol/events';
import {
  PresenceEntry,
  ProductId,
  RoomMembership,
  UserId,
} from '@multiplayer/protocol/room';
import { DEFAULT_TIER } from '@multiplayer/protocol/tiers';
import { io as connect } from 'socket.io-client';
import * as Y from 'yjs';

import { computed, ref, shallowRef } from 'vue';

import { UNNAMED_DISPLAY_NAME } from './constants.ts';
import {
  MultiplayerControls,
  MultiplayerSocket,
  ProductActions,
  RoomActions,
  RoomControls,
  RoomState,
} from './types.ts';
import { roomIdUrl } from './url.ts';

/**
 * Marks a transaction as coming from the room, so the outbound handler can skip the echo
 * it would otherwise send straight back. Replaces the re-entrancy flag the op based sync
 * needed, and unlike that flag it survives anything asynchronous a host does on adopt.
 */
const REMOTE_ORIGIN = Symbol('multiplayer/remote');

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

  const awaitingServerState = ref(roomIdUrl.read() !== null);

  const membership = ref<RoomMembership | null>(null);
  const presence = ref<Record<UserId, PresenceEntry>>({});

  const mountedProduct = shallowRef<{
    productId: ProductId;
    doc: Y.Doc;
  } | null>(null);

  let socket: MultiplayerSocket | null = null;

  const inRoom = computed(() => membership.value !== null);

  /** for the paths a room already gates, where a missing socket is a broken invariant */
  const requireSocket = () =>
    nullThrows(socket, 'multiplayer: acted on a room with no socket');

  const requireMountedProduct = () =>
    nullThrows(mountedProduct.value, 'multiplayer: no product mounted');

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
    updatePresence: (entry) => requireSocket().emit('updatePresence', entry),
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
  };

  /** local changes flow out from here on, and remote ones land through {@link REMOTE_ORIGIN} */
  const mountProduct = (productId: ProductId) => {
    const doc = new Y.Doc();
    mountedProduct.value = { productId, doc };

    doc.on('update', (update: DocUpdate, origin: unknown) => {
      // outside a room the document still tracks the graph, so that opening one can
      // publish it without asking the host for anything
      if (origin === REMOTE_ORIGIN || !inRoom.value) return;
      requireSocket().emit('docUpdate', { productId, update });
    });

    return doc;
  };

  /** applies what a join handed back, before the host binds and sees the result */
  const adoptJoinResult = (doc: Y.Doc, result: JoinResult) => {
    if (!result.joined) return;
    adoptMembership(result);
    // absent when nobody has opened this product in the room yet, which leaves the
    // document empty and makes the host seed it instead
    if (result.doc) Y.applyUpdate(doc, toDocUpdate(result.doc), REMOTE_ORIGIN);
  };

  const attachHandlers = (activeSocket: MultiplayerSocket) => {
    activeSocket.on('rosterChanged', (data) => {
      // roster update may land in the gap between a kick or a disband
      if (!membership.value) return;
      membership.value.data = data;
    });

    activeSocket.on('presenceChanged', ({ userId: peerId, entry }) => {
      presence.value[peerId] = entry;
    });

    activeSocket.on('docUpdated', ({ productId, update }) => {
      // arriving for a product that is not on screen is normal during navigation, and
      // entering re-fetches, so there is nothing to do and nothing to report
      const mounted = mountedProduct.value;
      if (mounted?.productId !== productId) return;
      Y.applyUpdate(mounted.doc, toDocUpdate(update), REMOTE_ORIGIN);
    });

    // a reconnect can have missed updates entirely, so it asks for the difference
    // between what the room holds and what this document already has
    activeSocket.on('connect', () => {
      const mounted = mountedProduct.value;
      if (mounted === null || !inRoom.value) return;
      const { productId, doc } = mounted;
      activeSocket.emit(
        'syncDoc',
        { productId, stateVector: Y.encodeStateVector(doc) },
        (update) => {
          if (!update) return;
          Y.applyUpdate(doc, toDocUpdate(update), REMOTE_ORIGIN);
        },
      );
    });

    // the room is gone, so the id in the url is dead. strip it and carry on locally,
    // with no error state: the same quiet fallback a bad id gets on the way in
    activeSocket.on('roomDisbanded', () => {
      roomIdUrl.strip();
      reset();
    });
    activeSocket.on('kicked', () => {
      roomIdUrl.strip();
      reset();
    });

    activeSocket.on('movedToProduct', ({ productId }) => {
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
      // the mounted product's document is already tracking the graph, so the room opens
      // on exactly what is on screen
      const doc = Y.encodeStateAsUpdate(requireMountedProduct().doc);
      const started = await new Promise<RoomMembership>((resolve) => {
        activeSocket.emit(
          'startRoom',
          { displayName, productId, doc },
          resolve,
        );
      });

      adoptMembership(started);

      // the id becomes shareable the moment the room exists, and survives a refresh
      roomIdUrl.write(started.roomId);

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

      adoptJoinResult(requireMountedProduct().doc, result);
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
      const doc = mountProduct(productId);

      // resolution happens once for the life of the connection rather than per mount,
      // so navigating between products never re-reads the url or re-joins
      if (!roomResolutionAttempted) {
        roomResolutionAttempted = true;
        const targetRoomId = roomIdUrl.read();

        if (targetRoomId) {
          try {
            // no name to hand over yet: the panel that owns it has not mounted, so the
            // room holds the placeholder until it renames through room.controls
            const result = await roomActions.join({
              roomId: targetRoomId,
              productId,
              displayName: UNNAMED_DISPLAY_NAME,
            });
            // bound after the document is populated, so the host adopts the room rather
            // than seeding it with whatever was on screen
            host.bind(doc);
            if (result.joined) return 'room';

            // a dead room id is a non event: strip it and carry on exactly as if the
            // param had never been there, with no error surfaced
            roomIdUrl.strip();
            return 'local';
          } finally {
            awaitingServerState.value = false;
          }
        }

        awaitingServerState.value = false;
      }

      // the ordinary outcome for every page load outside a room, and the answer the
      // harness needs before it restores anything local
      if (!inRoom.value) {
        host.bind(doc);
        return 'local';
      }

      // navigating inside a room waits too: the new product mounts empty and the
      // server is what fills it
      awaitingServerState.value = true;
      try {
        const result = await new Promise<JoinResult>((resolve) => {
          requireSocket().emit('enterProduct', { productId }, resolve);
        });
        adoptJoinResult(doc, result);
        host.bind(doc);
        return 'room';
      } finally {
        awaitingServerState.value = false;
      }
    },

    /** on unmount. the connection, the room and the roster all outlive this */
    leave: (productId) => {
      const mounted = mountedProduct.value;
      if (mounted?.productId !== productId) return;
      mounted.doc.destroy();
      mountedProduct.value = null;
    },
  };

  return {
    actions: {
      room: roomActions,
      product: productActions,
    },

    room,

    awaitingServerState,
  };
};
