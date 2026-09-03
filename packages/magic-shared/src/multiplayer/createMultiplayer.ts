import { createEventHub } from '@core/events/createEventHub';
import { nullThrows } from '@core/utils/assert';
import { DocUpdate, toDocUpdate } from '@multiplayer/protocol/doc';
import {
  DisbandReason,
  JoinResult,
  ProductEntryState,
  StartResult,
} from '@multiplayer/protocol/events';
import {
  ProductId,
  ProductPresence,
  RoomId,
  RoomMembership,
  UserId,
  emptyProductPresence,
} from '@multiplayer/protocol/room';
import { appendStrokePoints } from '@multiplayer/protocol/stroke';
import { DEFAULT_TIER } from '@multiplayer/protocol/tiers';
import { io as connect } from 'socket.io-client';
import * as Y from 'yjs';

import { computed, ref, shallowRef } from 'vue';

import { isProductId } from '../product/manifests/isValidProductId.ts';
import { getNavigationName } from '../product/manifests/navigationName.ts';
import { DocBindMode } from '../product/types.ts';
import { ToastOptions } from '../ui/toast/types.ts';
import { toast } from '../ui/toast/useToastState.ts';
import { REMOTE_ORIGIN, getDisplayName } from './constants.ts';
import { createMultiplayerEventRegistry } from './events.ts';
import { clearSeat, readSeat, writeSeat } from './seat.ts';
import {
  ConnectionControls,
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

/** an ending arrives unasked for, so it stays up long enough to be read on the way past */
const SESSION_ENDED_TOAST_MS = 10_000;

const MOVED_TOAST_MS = 6_000;

/**
 * exhaustive, so a disband reason added to the union is a compile error here rather than
 * a session that ends without saying why
 */
const DISBAND_MESSAGE: Record<
  DisbandReason,
  { title: string; description: string; duration: ToastOptions['duration'] }
> = {
  hostLeft: {
    title: 'The Session Ended',
    description:
      'The host closed it. What is on screen is still yours to edit.',
    duration: SESSION_ENDED_TOAST_MS,
  },
  inactivity: {
    title: 'The Session Timed Out',
    description:
      'It closed after going quiet for too long. What is on screen is still yours to edit.',
    // the room only goes quiet because nobody was watching, so this one waits to be read
    duration: 'persistent',
  },
};

/** the name a product goes by on screen, falling back to the raw id for one we cannot place */
const productName = (productId: ProductId) =>
  isProductId(productId) ? getNavigationName(productId) : productId;

export const createMultiplayer = ({
  serverUrl,
  onMovedToProduct,
}: CreateMultiplayerOptions): ConnectionControls => {
  const events = createEventHub(createMultiplayerEventRegistry());

  const membership = ref<RoomMembership | null>(null);
  /** peers on the mounted product only, seeded on entry and cleared on the way out */
  const presence = ref<Record<UserId, ProductPresence>>({});

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

    presence: {
      moveCursor: (position) =>
        requireSocket().emit('moveCursor', { position }),
      moveCamera: (camera) => requireSocket().emit('moveCamera', { camera }),
      setAnnotating: (isAnnotating) =>
        requireSocket().emit('setAnnotating', { isAnnotating }),
      startDrag: (elements) => requireSocket().emit('startDrag', { elements }),
      updateDrag: (elements) =>
        requireSocket().emit('updateDrag', { elements }),
      endDrag: () => requireSocket().emit('endDrag'),
      startStroke: (stroke) => requireSocket().emit('startStroke', { stroke }),
      extendStroke: (points) =>
        requireSocket().emit('extendStroke', { points }),
      endStroke: () => requireSocket().emit('endStroke'),
    },
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

  /**
   * Membership and the seat that proves it, which are never taken on separately: the
   * server is free to answer a claim by seating this client somewhere new, so what came
   * back is always what gets held rather than what was asked for.
   */
  const rememberMembership = (next: RoomMembership) => {
    membership.value = next;
    writeSeat(next.roomId, { userId: next.userId, token: next.seatToken });
  };

  /** the one way room state is taken on, whether the room was opened or joined */
  const adoptMembership = (next: RoomMembership) => {
    rememberMembership(next);
    events.emit('onRoomJoined');
  };

  const closeSocket = () => {
    socket?.disconnect();
    socket = null;
  };

  /**
   * Out of the room, keeping whatever is written down about the seat. The socket goes:
   * one left open in no room holds an idle server awake on its heartbeat alone, and
   * reconnects forever if it drops, for a room there is no way back into.
   */
  const abandonRoom = () => {
    roomIdUrl.strip();
    closeSocket();
    reset();
  };

  /** the same, for the endings that spend the seat rather than pass it on */
  const releaseRoom = () => {
    const currentRoomId = membership.value?.roomId;
    if (currentRoomId) clearSeat(currentRoomId);
    abandonRoom();
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

    // presence is the product's, not the room's, so it goes with it. telling the room is
    // what releases anything this client was still dragging when it unmounted
    presence.value = {};
    if (inRoom.value)
      socket?.emit('leaveProduct', { productId: mounted.productId });
  };

  /**
   * Opens a document for the product and ties the product to it, replacing any binding
   * already in place. The room's copy lands before the product binds, so an adopting product
   * is handed the document it is meant to take on rather than an empty one.
   */
  const openProduct = (
    { productId, host }: ProductBinding,
    mode: DocBindMode,
    roomDoc?: DocUpdate | null,
  ) => {
    releaseProduct();

    const doc = new Y.Doc();
    doc.on('update', (update: DocUpdate, origin: unknown) => {
      if (origin === REMOTE_ORIGIN || !inRoom.value) return;
      requireSocket().emit('docUpdate', { productId, update });
    });

    if (roomDoc) Y.applyUpdate(doc, toDocUpdate(roomDoc), REMOTE_ORIGIN);

    const binding = host.bind(doc, mode);
    mountedProduct.value = { productId, doc, unbind: binding?.unbind };
    return doc;
  };

  const attachHandlers = (activeSocket: MultiplayerSocket) => {
    activeSocket.on('rosterChanged', (data) => {
      // roster update may land in the gap between a kick or a disband
      if (!membership.value) return;
      membership.value.data = data;

      // backstop: a peerLeftProduct that never landed would otherwise strand a peer on
      // screen forever, holding whatever they were dragging when they went
      for (const peerId of Object.keys(presence.value)) {
        if (data.roster[peerId]) continue;
        delete presence.value[peerId];
        events.emit('onPeerLeftProduct', peerId);
      }
    });

    /** a signal can be the first thing heard from a peer, so the entry is made on demand */
    const peerPresence = (peerId: UserId) =>
      (presence.value[peerId] ??= emptyProductPresence());

    activeSocket.on('cursorMoved', ({ userId: peerId, position }) => {
      peerPresence(peerId).cursorPosition = position;
      events.emit('onPeerCursorMoved', peerId, position);
    });

    activeSocket.on('cameraMoved', ({ userId: peerId, camera }) => {
      peerPresence(peerId).cameraState = camera;
      events.emit('onPeerCameraMoved', peerId, camera);
    });

    activeSocket.on('annotatingChanged', ({ userId: peerId, isAnnotating }) => {
      peerPresence(peerId).isAnnotating = isAnnotating;
      events.emit('onPeerAnnotatingChanged', peerId, isAnnotating);
    });

    activeSocket.on('dragStarted', ({ userId: peerId, elements }) => {
      peerPresence(peerId).drag = elements;
      events.emit('onPeerDragStarted', peerId, elements);
    });

    activeSocket.on('dragMoved', ({ userId: peerId, elements }) => {
      peerPresence(peerId).drag = elements;
      events.emit('onPeerDragMoved', peerId, elements);
    });

    activeSocket.on('dragEnded', ({ userId: peerId }) => {
      // the sweep announces to the whole product, this client included, and a release of
      // our own drag is the local drag plugin's business rather than a peer event
      if (peerId === membership.value?.userId) return;
      peerPresence(peerId).drag = null;
      events.emit('onPeerDragEnded', peerId);
    });

    activeSocket.on('strokeStarted', ({ userId: peerId, stroke }) => {
      peerPresence(peerId).stroke = stroke;
      events.emit('onPeerStrokeStarted', peerId, stroke);
    });

    activeSocket.on('strokeExtended', ({ userId: peerId, points }) => {
      const { stroke } = peerPresence(peerId);
      // a delta for a stroke this client never saw start has nothing to append to
      if (!stroke) return;

      appendStrokePoints(stroke, points);
      events.emit('onPeerStrokeExtended', peerId, points);
    });

    activeSocket.on('strokeEnded', ({ userId: peerId }) => {
      // the sweep announces to the whole product, this client included, and the end of our
      // own stroke is the annotation engine's business rather than a peer event
      if (peerId === membership.value?.userId) return;
      peerPresence(peerId).stroke = null;
      events.emit('onPeerStrokeEnded', peerId);
    });

    activeSocket.on(
      'peerEnteredProduct',
      ({ userId: peerId, presence: entry }) => {
        presence.value[peerId] = entry;
        events.emit('onPeerEnteredProduct', peerId);
      },
    );

    activeSocket.on('peerLeftProduct', ({ userId: peerId }) => {
      delete presence.value[peerId];
      events.emit('onPeerLeftProduct', peerId);
    });

    activeSocket.on('docUpdated', ({ productId, update }) => {
      // arriving for a product that is not on screen is normal during navigation, and
      // entering re-fetches, so there is nothing to do and nothing to report
      const mounted = mountedProduct.value;
      if (mounted?.productId !== productId) return;
      Y.applyUpdate(mounted.doc, toDocUpdate(update), REMOTE_ORIGIN);
    });

    // a reconnect is a different socket, and the room has never heard of it. nothing
    // this client sends counts until the seat is claimed back, so that goes first and
    // everything the product needs follows from it
    activeSocket.on('connect', () => {
      const current = membership.value;
      if (!current) return;
      // an answer that never lands leaves membership alone on purpose: the transport
      // reconnects on its own, and the next connect is another go at the same claim
      reclaimRoom(activeSocket, current.roomId).catch((err) => {
        console.warn(
          'multiplayer: could not reclaim the seat on reconnect',
          err,
        );
      });
    });

    // the room is gone, so the id in the url and the seat behind it are both dead
    activeSocket.on('roomDisbanded', ({ reason }) => {
      toast.show({ ...DISBAND_MESSAGE[reason], severity: 'info' });
      releaseRoom();
      events.emit('onRoomDisbanded', reason);
    });
    // the seat is gone but not spent: it belongs to the tab that took it, and clearing
    // what is stored here would strand them the next time they had to reconnect
    activeSocket.on('seatTaken', () => {
      toast.show({
        title: 'The Session Moved To Another Tab',
        description:
          'Another tab on this browser took over the session, so this one left it.',
        severity: 'warn',
        duration: SESSION_ENDED_TOAST_MS,
      });
      abandonRoom();
      events.emit('onSeatTaken');
    });

    // the same teardown a disband gets, except this one is worth announcing: the room
    // carried on without them, so silence would read as the session having ended
    activeSocket.on('kicked', ({ by }) => {
      toast.show({
        title: 'Removed From The Session',
        description: `${by.displayName} removed you from the session.`,
        severity: 'warn',
        duration: SESSION_ENDED_TOAST_MS,
      });
      releaseRoom();
      events.emit('onKicked', by);
    });

    activeSocket.on('movedToProduct', ({ productId, by }) => {
      toast.show({
        title: `Moved To ${productName(productId)}`,
        description: `${by.displayName} brought the session here.`,
        severity: 'info',
        duration: MOVED_TOAST_MS,
      });
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

  /** the claim, sent on every join alike: the server decides whether it is honoured */
  const requestJoin = (activeSocket: MultiplayerSocket, roomId: RoomId) =>
    requestFromServer<JoinResult>((respond) =>
      activeSocket.timeout(ACK_TIMEOUT_MS).emit(
        'joinRoom',
        {
          roomId,
          displayName: getDisplayName(),
          seat: readSeat(roomId),
        },
        respond,
      ),
    );

  /**
   * Sitting back down after a drop, in the order the server needs it: the seat first,
   * since a write from a socket with no roster entry is refused, then the product, then
   * the document. Deliberately not the arrival path: that opens a fresh document, and
   * anything edited while this client was away lives only in the one already on screen.
   */
  const reclaimRoom = async (
    activeSocket: MultiplayerSocket,
    roomId: RoomId,
  ) => {
    const result = await requestJoin(activeSocket, roomId);

    // the room ended while this client was away, which is the one refusal there is
    if (!result.joined) {
      releaseRoom();
      return;
    }

    rememberMembership(result);

    const mounted = mountedProduct.value;
    if (!mounted) return;
    const { productId, doc } = mounted;

    // puts this client back on the product and hands back what everyone there is doing,
    // both of which the room dropped along with the socket
    const state = await requestFromServer<ProductEntryState>((respond) =>
      activeSocket
        .timeout(ACK_TIMEOUT_MS)
        .emit('enterProduct', { productId }, respond),
    );
    presence.value = state.presence;
    events.emit('onPresenceSeeded');

    // merged both ways rather than replaced. what the room moved on to is asked for as a
    // diff, and this document is pushed whole, because edits made while disconnected were
    // refused as they happened and the room has never seen them
    activeSocket.emit(
      'syncDoc',
      { productId, stateVector: Y.encodeStateVector(doc) },
      (update) => {
        if (!update) return;
        Y.applyUpdate(doc, toDocUpdate(update), REMOTE_ORIGIN);
      },
    );
    activeSocket.emit('docUpdate', {
      productId,
      update: Y.encodeStateAsUpdate(doc),
    });
  };

  const ensureSocket = () => {
    if (socket) return socket;
    socket = connect(serverUrl, {
      transports: ['websocket'],
      // the default 5s ceiling puts every client that was in a room back on the server
      // within one window of it coming up, each pushing a whole document as it lands.
      // backing off further spreads that arrival out, and socket.io jitters it by half
      reconnectionDelayMax: 20_000,
    });
    attachHandlers(socket);
    return socket;
  };

  // without this, a closed tab lingers in everyone's roster until the heartbeat times out.
  // pagehide covers close and refresh, and unlike visibilitychange it skips tab switches
  window.addEventListener('pagehide', () => socket?.disconnect());

  /** the product's own state, the one and only thing a room ever seeds from */
  const seedFromProduct = (binding: ProductBinding) =>
    Y.encodeStateAsUpdate(openProduct(binding, 'seed'));

  /**
   * Takes on the room's copy of a product, replacing whatever the product was showing.
   * A room that has never reached this product has no copy, and an empty one is still
   * the room's answer: the product opens blank rather than donating what was on screen.
   */
  const adoptRoomProduct = async ({ productId, host }: ProductBinding) => {
    events.emit('onPendingStarted');
    try {
      const state = await requestFromServer<ProductEntryState>((respond) =>
        requireSocket()
          .timeout(ACK_TIMEOUT_MS)
          .emit('enterProduct', { productId }, respond),
      );

      openProduct({ productId, host }, 'adopt', state.doc);

      // what everyone on the product is already doing, so a peer sitting perfectly still
      // is on screen from the first frame rather than once they happen to move
      presence.value = state.presence;
      events.emit('onPresenceSeeded');
    } finally {
      events.emit('onPendingEnded');
    }
  };

  const roomActions: RoomActions = {
    start: async ({ productId, host }) => {
      const activeSocket = ensureSocket();
      const doc = seedFromProduct({ productId, host });
      const result = await requestFromServer<StartResult>((respond) =>
        activeSocket
          .timeout(ACK_TIMEOUT_MS)
          .emit(
            'startRoom',
            { displayName: getDisplayName(), productId, doc },
            respond,
          ),
      );

      // nothing to hold a connection open for, since no room was opened
      if (!result.started) {
        closeSocket();
        return result;
      }

      adoptMembership(result);

      // the id becomes shareable the moment the room exists, and survives a refresh
      roomIdUrl.write(result.roomId);

      return result;
    },

    join: async ({ roomId }) => {
      const activeSocket = ensureSocket();
      events.emit('onPendingStarted');
      const result = await requestJoin(activeSocket, roomId).finally(() =>
        events.emit('onPendingEnded'),
      );

      // the only refusal the server has is a room it cannot find, which makes the id
      // dead rather than unlucky, and any seat held in it dead with it. a request that
      // never came back leaves both alone
      if (!result.joined) {
        console.warn(`multiplayer: no room to join under the id "${roomId}"`);
        clearSeat(roomId);
        roomIdUrl.strip();
        return result;
      }
      roomIdUrl.write(result.roomId);
      adoptMembership(result);

      return result;
    },

    // the one departure that spends the seat, which is what separates it from a drop
    leave: () => {
      socket?.emit('leaveRoom');
      releaseRoom();
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
