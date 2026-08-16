import { randomUUID } from 'node:crypto';
import type { Server as HttpServer } from 'node:http';

import {
  ClientToServerEvents,
  JoinResult,
  ServerToClientEvents,
} from '@multiplayer/protocol/events';
import {
  ProductId,
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
  createRoom,
  createRoomStore,
  encodeProductDoc,
  encodeProductDocDiff,
  isHost,
  removeMember,
  setMemberDisplayName,
  setMemberProduct,
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
  options: { corsOrigins: string[] },
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

  const connections = new Map<UserId, MemberConnection>();

  io.on('connection', (socket) => {
    const userId: UserId = randomUUID();
    let currentRoomId: RoomId | null = null;

    const currentRoom = () =>
      currentRoomId === null ? undefined : rooms.get(currentRoomId);

    /** room wide: roster, presence and disband concern everyone regardless of product */
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

    const enterProductChannel = (productId: ProductId) => {
      if (currentRoomId === null) return;
      if (currentProductId !== null) {
        socket.leave(productChannel(currentRoomId, currentProductId));
      }
      currentProductId = productId;
      socket.join(productChannel(currentRoomId, productId));
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
      socket.leave(currentRoomId);
      if (currentProductId !== null) {
        socket.leave(productChannel(currentRoomId, currentProductId));
      }
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
      if (!room) return callback(null);

      enterProductChannel(productId);
      setMemberProduct(room, userId, productId);
      callback(encodeProductDoc(room, productId));
      broadcastRoster(room);
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

    socket.on('updatePresence', (entry) => {
      relayToRoom('presenceChanged', { userId, entry });
    });

    socket.on('disconnect', () => {
      connections.delete(userId);

      const room = currentRoom();
      if (!room || currentRoomId === null) return;

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
