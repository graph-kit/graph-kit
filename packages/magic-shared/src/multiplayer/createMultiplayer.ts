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

import { REMOTE_ORIGIN, UNNAMED_DISPLAY_NAME } from './constants.ts';
import {
  MultiplayerControls,
  MultiplayerSocket,
  ProductActions,
  RoomActions,
  RoomControls,
  RoomState,
} from './types.ts';
import { roomIdUrl } from './url.ts';

type CreateMultiplayerOptions = {
  serverUrl: string;
  onMovedToProduct: (productId: ProductId) => void;
};

export const createMultiplayer = ({
  serverUrl,
  onMovedToProduct,
}: CreateMultiplayerOptions): MultiplayerControls => {
  const awaitingServerState = ref(roomIdUrl.read() !== null);

  const membership = ref<RoomMembership | null>(null);
  const presence = ref<Record<UserId, PresenceEntry>>({});

  const mountedProduct = shallowRef<{
    productId: ProductId;
    doc: Y.Doc;
  } | null>(null);

  let socket: MultiplayerSocket | null = null;

  const inRoom = computed(() => membership.value !== null);

  const requireSocket = () =>
    nullThrows(socket, 'multiplayer: acted on a room with no socket');

  const requireMountedProduct = () =>
    nullThrows(mountedProduct.value, 'multiplayer: no product mounted');

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
    socket = connect(serverUrl, { transports: ['websocket'] });
    attachHandlers(socket);
    return socket;
  };

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

      return started.roomId;
    },

    join: async ({ roomId, displayName }) => {
      const activeSocket = ensureSocket();
      const result = await new Promise<JoinResult>((resolve) => {
        activeSocket.emit('joinRoom', { roomId, displayName }, resolve);
      });

      if (result.joined) adoptMembership(result);
      return result;
    },

    leave: () => {
      socket?.disconnect();
      socket = null;
      reset();
    },
  };

  /**
   * Whether this connection has a room, settled once at construction. A product mount
   * awaits the answer rather than producing it, so no mount is special.
   */
  const roomResolution = (async () => {
    const targetRoomId = roomIdUrl.read();
    if (!targetRoomId) return;

    // no name to hand over yet: the panel that owns it has not mounted, so the room
    // holds the placeholder until it renames through room.controls
    const result = await roomActions.join({
      roomId: targetRoomId,
      displayName: UNNAMED_DISPLAY_NAME,
    });

    // a dead room id is a non event: strip it and carry on exactly as if the param had
    // never been there, with no error surfaced
    if (!result.joined) roomIdUrl.strip();
  })();

  const productActions: ProductActions = {
    enter: async (productId, host) => {
      const doc = mountProduct(productId);

      try {
        await roomResolution;
        if (inRoom.value) {
          // the product mounts empty and the server is what fills it, on the first
          // mount and on every navigation inside a room alike
          awaitingServerState.value = true;
          const update = await new Promise<DocUpdate | null>((resolve) => {
            requireSocket().emit('enterProduct', { productId }, resolve);
          });
          if (update) Y.applyUpdate(doc, toDocUpdate(update), REMOTE_ORIGIN);
        }
      } finally {
        awaitingServerState.value = false;
      }

      // bound after the document is populated, so the graph adopts the room's state
      // rather than seeding it with whatever was on screen
      host.bind(doc);
      return inRoom.value ? 'room' : 'local';
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
