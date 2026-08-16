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

import { REMOTE_ORIGIN, getDisplayName } from './constants.ts';
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

const ACK_TIMEOUT_MS = 10_000;

export const createMultiplayer = ({
  serverUrl,
  onMovedToProduct,
}: CreateMultiplayerOptions): MultiplayerControls => {
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
    events.emit('onPendingEnded');
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

  /** rejects rather than waiting forever when the answer never lands */
  const requestFromServer = <Answer>(
    send: (respond: (error: Error | null, answer: Answer) => void) => void,
  ) =>
    new Promise<Answer>((resolve, reject) => {
      send((error, answer) => (error ? reject(error) : resolve(answer)));
    });

  const ensureSocket = () => {
    if (socket) return socket;
    socket = connect(serverUrl, { transports: ['websocket'] });
    attachHandlers(socket);
    return socket;
  };

  // a tab that goes without closing its socket is only noticed once the heartbeat times
  // out, which leaves whoever left sitting in everyone else's roster until then. pagehide
  // covers the close and the refresh alike, and unlike visibilitychange it does not fire
  // for a tab switch, which is not a departure
  window.addEventListener('pagehide', () => socket?.disconnect());

  /** the product's own state, which is what a room opens on */
  const seedFromProduct = (binding: ProductBinding) =>
    Y.encodeStateAsUpdate(openProduct(binding));

  /** takes on the room's copy of a product, replacing whatever the product was showing */
  const adoptRoomProduct = async ({ productId, host }: ProductBinding) => {
    events.emit('onPendingStarted');
    try {
      const update = await requestFromServer<DocUpdate | null>((respond) =>
        requireSocket()
          .timeout(ACK_TIMEOUT_MS)
          .emit('enterProduct', { productId }, respond),
      );

      openProduct({ productId, host }, (doc) => {
        // absent when nobody in the room has opened this product yet, which leaves the
        // document empty and makes this product seed it instead
        if (update) Y.applyUpdate(doc, toDocUpdate(update), REMOTE_ORIGIN);
      });
    } finally {
      events.emit('onPendingEnded');
    }
  };

  const roomActions: RoomActions = {
    start: async ({ productId, host }) => {
      const activeSocket = ensureSocket();
      const doc = seedFromProduct({ productId, host });
      const started = await requestFromServer<RoomMembership>((respond) =>
        activeSocket
          .timeout(ACK_TIMEOUT_MS)
          .emit(
            'startRoom',
            { displayName: getDisplayName(), productId, doc },
            respond,
          ),
      );

      adoptMembership(started);

      // the id becomes shareable the moment the room exists, and survives a refresh
      roomIdUrl.write(started.roomId);

      return started.roomId;
    },

    join: async ({ roomId, productId, host }) => {
      const activeSocket = ensureSocket();
      events.emit('onPendingStarted');
      const result = await requestFromServer<JoinResult>((respond) =>
        activeSocket
          .timeout(ACK_TIMEOUT_MS)
          .emit('joinRoom', { roomId, displayName: getDisplayName() }, respond),
      ).finally(() => events.emit('onPendingEnded'));

      // the only refusal the server has is a room it cannot find, which makes the id
      // dead rather than unlucky. a request that never came back leaves it in the url
      if (!result.joined) {
        console.warn(`multiplayer: no room to join under the id "${roomId}"`);
        roomIdUrl.strip();
        return result;
      }

      roomIdUrl.write(result.roomId);
      adoptMembership(result);
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

    events,
  };
};
