import { randomUUID } from 'node:crypto';
import type { Server as HttpServer } from 'node:http';

import {
  ClientToServerEvents,
  JoinResult,
  ServerToClientEvents,
} from '@multiplayer/protocol/events';
import {
  ProductId,
  ProductPresence,
  RoomId,
  RosterEntry,
  UserId,
} from '@multiplayer/protocol/room';
import { Server } from 'socket.io';

import { generateRoomId, normalizeRoomId } from './room-id.ts';
import {
  Room,
  addMember,
  applyProductDocUpdate,
  canRunRoomCommand,
  canWriteProduct,
  clearDrag,
  clearPresence,
  createRoom,
  createRoomStore,
  encodeProductDoc,
  encodeProductDocDiff,
  ensurePresence,
  expireStaleDrags,
  hasDrag,
  isHost,
  presenceIn,
  removeMember,
  setDrag,
  setMemberDisplayName,
  setMemberProduct,
  setPresence,
  setTier,
} from './rooms.ts';

/**
 * document traffic is routed to the people actually looking at that product rather than
 * to the whole room, so nobody pays for products they are not on. derived from the
 * roster the server already maintains, which is why clients never manage a subscription.
 */
const productChannel = (roomId: RoomId, productId: ProductId): string =>
  `${roomId}:${productId}`;

/**
 * How long a drag may go untouched before the room releases it. The backstop for a client
 * that stopped talking without dropping, which the ping timeout alone would leave holding
 * nodes for twice as long. Deliberately above any pause a real gesture takes: a drag that
 * does trip it is revived by its owner's next move, see the `updateDrag` handler.
 */
const DRAG_STALE_MS = 5_000;
const DRAG_SWEEP_INTERVAL_MS = 1_000;

/** overridable so a test can watch a drag go stale without waiting out a real one */
export type DragSweepOptions = {
  staleAfterMs?: number;
  sweepIntervalMs?: number;
};

/**
 * what a room command aimed at one member needs from that member's own connection, whose
 * room and product channels are known nowhere else. every socket registers one on connect
 */
type MemberConnection = {
  evict: (by: RosterEntry) => void;
  moveTo: (productId: ProductId, by: RosterEntry) => void;
};

const joinResultFor = (
  room: Room,
  roomId: RoomId,
  userId: UserId,
): JoinResult => ({
  joined: true,
  roomId,
  userId,
  data: room.data,
});

export const createSocketServer = (
  httpServer: HttpServer,
  options: { corsOrigins: string[]; dragSweep?: DragSweepOptions },
): Server<ClientToServerEvents, ServerToClientEvents> => {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(
    httpServer,
    {
      cors: { origin: options.corsOrigins },
      // the backstop for a client that vanished without saying so, which the defaults
      // leave sitting in the roster for 45 seconds. the floor is how long a slow network
      // may swallow a pong before its owner is dropped, and dropping a host disbands
      pingInterval: 10_000,
      pingTimeout: 10_000,
    },
  );

  const rooms = createRoomStore();

  /**
   * Releases drags whose owner has gone quiet, across every room. Announced with `io`
   * rather than a relay because there is no socket behind an expiry, which also means
   * the owner hears its own release: harmless, since a client ignores peer events for
   * its own id, and it is what lets a stalled client notice it has been let go.
   */
  const staleAfterMs = options.dragSweep?.staleAfterMs ?? DRAG_STALE_MS;
  const sweepIntervalMs =
    options.dragSweep?.sweepIntervalMs ?? DRAG_SWEEP_INTERVAL_MS;

  const sweepStaleDrags = () => {
    const now = Date.now();
    for (const [roomId, room] of rooms.entries()) {
      const expired = expireStaleDrags(room, now, staleAfterMs);
      for (const { productId, userId } of expired) {
        io.to(productChannel(roomId, productId)).emit('dragEnded', { userId });
      }
    }
  };

  // unref'd: sweeping is never a reason for the process to stay alive
  setInterval(sweepStaleDrags, sweepIntervalMs).unref();

  const connections = new Map<UserId, MemberConnection>();

  io.on('connection', (socket) => {
    const userId: UserId = randomUUID();
    let currentRoomId: RoomId | null = null;

    const currentRoom = () =>
      currentRoomId === null ? undefined : rooms.get(currentRoomId);

    /** room wide: roster and disband concern everyone regardless of product */
    const relayToRoom = <Event extends keyof ServerToClientEvents>(
      event: Event,
      ...args: Parameters<ServerToClientEvents[Event]>
    ) => {
      if (currentRoomId === null) return;
      socket.broadcast.to(currentRoomId).emit(event, ...args);
    };

    /** every relay carries the payload id so one write can be traced across clients */
    const relayToProduct = <Event extends keyof ServerToClientEvents>(
      productId: ProductId,
      event: Event,
      ...args: Parameters<ServerToClientEvents[Event]>
    ) => {
      if (currentRoomId === null) return;
      socket.broadcast
        .to(productChannel(currentRoomId, productId))
        .emit(event, ...args);
    };

    // tracked so navigating can leave the previous product channel, since socket.io has
    // no "leave every channel but the room" primitive
    let currentProductId: ProductId | null = null;

    /**
     * Announces to a product rather than relaying from this socket, because departures
     * are sent on paths where this connection is already gone or on its way out.
     */
    const announceToProduct = <Event extends keyof ServerToClientEvents>(
      productId: ProductId,
      event: Event,
      ...args: Parameters<ServerToClientEvents[Event]>
    ) => {
      if (currentRoomId === null) return;
      io.to(productChannel(currentRoomId, productId)).emit(event, ...args);
    };

    /**
     * Drops everything this member was doing on the product and says so there. Every way
     * of leaving one goes through here, which is what makes drag release total.
     */
    const leaveProductChannel = (productId: ProductId) => {
      if (currentRoomId === null) return;

      const room = currentRoom();
      if (room) {
        clearPresence(room, productId, userId);
        announceToProduct(productId, 'peerLeftProduct', { userId });
      }

      socket.leave(productChannel(currentRoomId, productId));
      if (currentProductId === productId) currentProductId = null;
    };

    const enterProductChannel = (productId: ProductId) => {
      if (currentRoomId === null) return;
      if (currentProductId !== null) leaveProductChannel(currentProductId);
      currentProductId = productId;
      socket.join(productChannel(currentRoomId, productId));

      const room = currentRoom();
      if (!room) return;

      // recorded before it is announced, so the next arrival is handed this member too
      // rather than having to wait for them to move
      const presence = ensurePresence(room, productId, userId);
      relayToProduct(productId, 'peerEnteredProduct', { userId, presence });
    };

    /**
     * The room and product a presence signal belongs to. Absent for a socket on neither,
     * whose signals are dropped rather than kept for a product it might enter later.
     */
    const presenceTarget = () => {
      const room = currentRoom();
      if (!room || currentProductId === null) return;
      return { room, productId: currentProductId };
    };

    /** everyone else on the product, since a client tracks peers and never itself */
    const peerPresenceIn = (room: Room, productId: ProductId) => {
      const peers: Record<UserId, ProductPresence> = {};
      for (const [peerId, entry] of Object.entries(
        presenceIn(room, productId),
      )) {
        if (peerId === userId) continue;
        peers[peerId] = entry;
      }
      return peers;
    };

    const broadcastRoster = (room: Room) => {
      if (currentRoomId === null) return;
      io.to(currentRoomId).emit('rosterChanged', room.data);
    };

    /**
     * Puts this connection back to where it was before joining, so what is left is a live
     * socket in no room. Every channel is left and the room is forgotten, or presence
     * would keep broadcasting to a room this user is no longer part of.
     */
    const evict = (by: RosterEntry) => {
      if (currentRoomId === null) return;
      if (currentProductId !== null) leaveProductChannel(currentProductId);
      socket.leave(currentRoomId);
      currentRoomId = null;
      currentProductId = null;
      socket.emit('kicked', { by });
    };

    /** the target alone, since a room command names one member and moves only them */
    const moveTo = (productId: ProductId, by: RosterEntry) => {
      socket.emit('movedToProduct', { productId, by });
    };

    connections.set(userId, { evict, moveTo });

    /**
     * The caller as the roster knows them, which is what a room command is attributed to.
     * Absent is an invariant break rather than a case to handle: every command sits behind
     * a tier, and a tier is something only a roster entry carries.
     */
    const commander = (room: Room): RosterEntry | undefined => {
      const entry = room.data.roster[userId];
      if (!entry) {
        console.error(
          `multiplayer: invariant broken, "${userId}" cleared a tier gate with no roster entry`,
        );
      }
      return entry;
    };

    socket.on('startRoom', ({ displayName, productId, doc }, callback) => {
      const roomId = generateRoomId(rooms.has);
      const room = createRoom({
        hostId: userId,
        displayName,
        productId,
        doc,
      });

      rooms.set(roomId, room);
      currentRoomId = roomId;
      socket.join(roomId);
      enterProductChannel(productId);

      callback({ roomId, userId, data: room.data });
    });

    // admission only: which product the member lands on is what enterProduct answers,
    // and every client sends one on its first mount
    socket.on('joinRoom', ({ roomId, displayName }, callback) => {
      const targetRoomId = normalizeRoomId(roomId);
      const room = rooms.get(targetRoomId);
      if (!room) return callback({ joined: false });

      currentRoomId = targetRoomId;
      socket.join(targetRoomId);
      addMember(room, { userId, displayName });

      callback(joinResultFor(room, targetRoomId, userId));
      broadcastRoster(room);
    });

    socket.on('enterProduct', ({ productId }, callback) => {
      const room = currentRoom();
      // the same quiet answer syncDoc gives, since an empty product and no room at all
      // leave the client with the same nothing to apply
      if (!room) return callback({ doc: null, presence: {} });

      enterProductChannel(productId);
      setMemberProduct(room, userId, productId);
      callback({
        doc: encodeProductDoc(room, productId),
        // read after entering, so a peer who left as this call landed is already gone
        presence: peerPresenceIn(room, productId),
      });
      broadcastRoster(room);
    });

    socket.on('leaveProduct', ({ productId }) => {
      if (currentProductId !== productId) return;
      leaveProductChannel(productId);
    });

    socket.on('docUpdate', ({ productId, update }) => {
      const room = currentRoom();
      if (!room || !canWriteProduct(room, userId)) return;

      applyProductDocUpdate(room, productId, update);
      relayToProduct(productId, 'docUpdated', { productId, update });
    });

    socket.on('syncDoc', ({ productId, stateVector }, callback) => {
      const room = currentRoom();
      if (!room) return callback(null);
      callback(encodeProductDocDiff(room, productId, stateVector));
    });

    // ungated: renaming yourself authorizes nothing, and being able to do it mid
    // session is what keeps an unnamed join from being a dead end
    socket.on('setDisplayName', ({ displayName }) => {
      const room = currentRoom();
      if (!room) return;
      if (!setMemberDisplayName(room, userId, displayName)) return;
      broadcastRoster(room);
    });

    socket.on('setTier', ({ userId: targetId, tier }) => {
      const room = currentRoom();
      if (!room) return;
      if (!setTier(room, userId, targetId, tier)) return;
      broadcastRoster(room);
    });

    socket.on('moveUser', ({ userId: targetId, productId }) => {
      const room = currentRoom();
      if (!room || !canRunRoomCommand(room, userId)) return;
      if (!room.data.roster[targetId]) return;

      const by = commander(room);
      if (!by) return;

      connections.get(targetId)?.moveTo(productId, by);
    });

    socket.on('kickUser', ({ userId: targetId }) => {
      const room = currentRoom();
      if (!room || !canRunRoomCommand(room, userId)) return;
      if (isHost(room, targetId)) return;

      const by = commander(room);
      if (!by) return;

      removeMember(room, targetId);
      // ahead of the broadcast so the roster the target last saw is the one it was still
      // in, rather than a final update that quietly erases them with no explanation
      connections.get(targetId)?.evict(by);
      broadcastRoster(room);
    });

    socket.on('moveCursor', ({ position }) => {
      const target = presenceTarget();
      if (!target) return;
      setPresence(target.room, target.productId, userId, {
        cursorPosition: position,
      });
      relayToProduct(target.productId, 'cursorMoved', { userId, position });
    });

    socket.on('moveCamera', ({ camera }) => {
      const target = presenceTarget();
      if (!target) return;
      setPresence(target.room, target.productId, userId, {
        cameraState: camera,
      });
      relayToProduct(target.productId, 'cameraMoved', { userId, camera });
    });

    socket.on('setAnnotating', ({ isAnnotating }) => {
      const target = presenceTarget();
      if (!target) return;
      setPresence(target.room, target.productId, userId, { isAnnotating });
      relayToProduct(target.productId, 'annotatingChanged', {
        userId,
        isAnnotating,
      });
    });

    socket.on('startDrag', ({ elements }) => {
      const target = presenceTarget();
      if (!target) return;
      setDrag(target.room, target.productId, userId, elements, Date.now());
      relayToProduct(target.productId, 'dragStarted', { userId, elements });
    });

    socket.on('updateDrag', ({ elements }) => {
      const target = presenceTarget();
      if (!target) return;

      // a move for a drag the room has no record of is one the sweep released early.
      // promoting it back to a start costs peers a blink, where dropping it would leave
      // the elements unheld for the rest of a gesture that is still very much happening
      const reviving = !hasDrag(target.room, target.productId, userId);
      setDrag(target.room, target.productId, userId, elements, Date.now());

      if (reviving) {
        relayToProduct(target.productId, 'dragStarted', { userId, elements });
        return;
      }
      relayToProduct(target.productId, 'dragMoved', { userId, elements });
    });

    socket.on('endDrag', () => {
      const target = presenceTarget();
      if (!target) return;
      clearDrag(target.room, target.productId, userId);
      relayToProduct(target.productId, 'dragEnded', { userId });
    });

    socket.on('disconnect', () => {
      connections.delete(userId);

      const room = currentRoom();
      if (!room || currentRoomId === null) return;

      // ahead of the disband check: a host leaving takes the room with it, but everyone
      // else's release has to land while there is still a product to announce it on
      if (currentProductId !== null) leaveProductChannel(currentProductId);

      if (isHost(room, userId)) {
        io.to(currentRoomId).emit('roomDisbanded');
        rooms.delete(currentRoomId);
        return;
      }

      removeMember(room, userId);
      broadcastRoster(room);
    });
  });

  return io;
};
