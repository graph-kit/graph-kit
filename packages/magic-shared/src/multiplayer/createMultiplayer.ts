import { nullThrows } from '@core/utils/assert';
import { createEventHub } from '@graph/primitives/events/createEventHub';
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

import { REMOTE_ORIGIN } from './constants.ts';
import { createMultiplayerEventRegistry } from './events.ts';
import {
  MultiplayerControls,
  MultiplayerSocket,
  ProductActions,
  ProductBinding,
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

  const events = createEventHub(createMultiplayerEventRegistry());

  const membership = ref<RoomMembership | null>(null);
  const presence = ref<Record<UserId, PresenceEntry>>({});

  const mountedProduct = shallowRef<{
    productId: ProductId;
    doc: Y.Doc;
    unbind: (() => void) | undefined;
  } | null>(null);

  let socket: MultiplayerSocket | null = null;

  const inRoom = computed(() => membership.value !== null);

  const requireSocket = () =>
    nullThrows(socket, 'multiplayer: acted on a room with no socket');

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
    events.emit('onRoomJoined');
  };

  const reset = () => {
    const wasInRoom = inRoom.value;
    awaitingServerState.value = false;
    membership.value = null;
    presence.value = {};
    // leaving a room this connection was never in is not a departure
    if (wasInRoom) events.emit('onRoomLeft');
  };

  const releaseProduct = () => {
    const mounted = mountedProduct.value;
    if (!mounted) return;
    mounted.unbind?.();
    mounted.doc.destroy();
    mountedProduct.value = null;
  };

  /**
   * Opens a document for the product and ties the host to it, replacing any binding
   * already in place. Whatever `adopt` writes lands before the host binds, so the
   * product takes on the room's state instead of seeding it with what was on screen.
   */
  const openProduct = (
    { productId, host }: ProductBinding,
    adopt?: (doc: Y.Doc) => void,
  ) => {
    releaseProduct();

    const doc = new Y.Doc();
    doc.on('update', (update: DocUpdate, origin: unknown) => {
      if (origin === REMOTE_ORIGIN || !inRoom.value) return;
      requireSocket().emit('docUpdate', { productId, update });
    });

    adopt?.(doc);

    const binding = host.bind(doc);
    mountedProduct.value = { productId, doc, unbind: binding?.unbind };
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

  /** the product's own state, which is what a room opens on */
  const seedFromProduct = (binding: ProductBinding) =>
    Y.encodeStateAsUpdate(openProduct(binding));

  /** takes on the room's copy of a product, replacing whatever the product was showing */
  const adoptRoomProduct = async ({ productId, host }: ProductBinding) => {
    awaitingServerState.value = true;
    try {
      const update = await new Promise<DocUpdate | null>((resolve) => {
        requireSocket().emit('enterProduct', { productId }, resolve);
      });

      openProduct({ productId, host }, (doc) => {
        // absent when nobody in the room has opened this product yet, which leaves the
        // document empty and makes this product seed it instead
        if (update) Y.applyUpdate(doc, toDocUpdate(update), REMOTE_ORIGIN);
      });
    } finally {
      awaitingServerState.value = false;
    }
  };

  const roomActions: RoomActions = {
    start: async ({ productId, host, displayName }) => {
      const activeSocket = ensureSocket();
      const doc = seedFromProduct({ productId, host });
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

    join: async ({ roomId, productId, host, displayName }) => {
      const activeSocket = ensureSocket();
      awaitingServerState.value = true;
      const result = await new Promise<JoinResult>((resolve) => {
        activeSocket.emit('joinRoom', { roomId, displayName }, resolve);
      }).finally(() => (awaitingServerState.value = false));

      if (!result.joined) return result;

      adoptMembership(result);
      // the room now decides what this product shows, so it is re-opened on the room's
      // copy rather than left on what was there a moment ago
      await adoptRoomProduct({ productId, host });
      return result;
    },

    leave: () => {
      socket?.disconnect();
      socket = null;
      reset();
      roomIdUrl.strip();
    },
  };

  const productActions: ProductActions = {
    enter: adoptRoomProduct,

    /** on unmount. the connection, the room and the roster all outlive this */
    leave: (productId) => {
      if (mountedProduct.value?.productId !== productId) return;
      releaseProduct();
    },
  };

  return {
    actions: {
      room: roomActions,
      product: productActions,
    },

    room,

    awaitingServerState,

    events,
  };
};
