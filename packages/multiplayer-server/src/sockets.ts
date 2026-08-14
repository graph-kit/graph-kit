import { randomUUID } from 'node:crypto';
import type { Server as HttpServer } from 'node:http';

import {
  ClientToServerEvents,
  JoinResult,
  ServerToClientEvents,
} from '@multiplayer/protocol/events';
import { ProductId, RoomId, UserId } from '@multiplayer/protocol/room';
import { Server } from 'socket.io';

import {
  Room,
  addMember,
  canRunRoomCommand,
  canWriteProduct,
  createRoom,
  createRoomStore,
  getServerState,
  isHost,
  patchServerState,
  removeMember,
  replaceServerState,
  setMemberDisplayName,
  setMemberProduct,
  setTier,
} from './rooms.ts';

const generateRoomId = (): RoomId =>
  randomUUID().replaceAll('-', '').slice(0, 10);

/**
 * server state traffic is routed to the people actually looking at that product rather than
 * to the whole room, so nobody pays for products they are not on. derived from the
 * roster the server already maintains, which is why clients never manage a subscription.
 */
const productChannel = (roomId: RoomId, productId: ProductId): string =>
  `${roomId}:${productId}`;

const joinResultFor = (
  room: Room,
  roomId: RoomId,
  userId: UserId,
  productId: ProductId,
): JoinResult => ({
  joined: true,
  roomId,
  userId,
  data: room.data,
  serverState: getServerState(room, productId),
});

/** the io instance is returned only so a caller can close it */
export const createSocketServer = (
  httpServer: HttpServer,
  options: { corsOrigins: string[] },
): Server<ClientToServerEvents, ServerToClientEvents> => {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(
    httpServer,
    { cors: { origin: options.corsOrigins } },
  );

  const rooms = createRoomStore();

  io.on('connection', (socket) => {
    // fresh every connection and never reused, so a refresh or reconnect is
    // indistinguishable from a first time join
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

    socket.on('startRoom', ({ displayName, productId, state }, callback) => {
      const roomId = generateRoomId();
      const room = createRoom({
        hostId: userId,
        displayName,
        productId,
        state,
      });

      rooms.set(roomId, room);
      currentRoomId = roomId;
      socket.join(roomId);
      enterProductChannel(productId);

      callback(roomId, userId, room.data);
    });

    socket.on('joinRoom', ({ roomId, displayName, productId }, callback) => {
      const room = rooms.get(roomId);
      // a dead room id is a non event, the client falls back quietly
      if (!room) return callback({ joined: false });

      currentRoomId = roomId;
      socket.join(roomId);
      enterProductChannel(productId);
      addMember(room, { userId, displayName, productId });

      callback(joinResultFor(room, roomId, userId, productId));
      broadcastRoster(room);
    });

    socket.on('enterProduct', ({ productId }, callback) => {
      const room = currentRoom();
      if (!room || currentRoomId === null) return callback({ joined: false });

      enterProductChannel(productId);
      setMemberProduct(room, userId, productId);
      callback(joinResultFor(room, currentRoomId, userId, productId));
      broadcastRoster(room);
    });

    socket.on('requestServerState', ({ productId }, callback) => {
      const room = currentRoom();
      if (!room || currentRoomId === null) return callback({ joined: false });
      callback(joinResultFor(room, currentRoomId, userId, productId));
    });

    socket.on('patchServerState', ({ payloadId, productId, ops }) => {
      const room = currentRoom();
      if (!room || !canWriteProduct(room, userId)) return;

      const receipt = patchServerState(room, productId, ops);
      // no server state yet means nobody has seeded this product, so there is nothing to patch
      if (!receipt) return;

      relayToProduct(productId, 'serverStatePatched', {
        payloadId,
        productId,
        ops,
        ...receipt,
      });
    });

    socket.on('replaceServerState', ({ payloadId, productId, state }) => {
      const room = currentRoom();
      if (!room || !canWriteProduct(room, userId)) return;

      const receipt = replaceServerState(room, productId, state);
      relayToProduct(productId, 'serverStateReplaced', {
        payloadId,
        productId,
        state,
        ...receipt,
      });
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

      // productId only, the client turns it into a route through its own helper
      io.to(currentRoomId ?? '').emit('movedToProduct', { productId });
    });

    socket.on('kickUser', ({ userId: targetId }) => {
      const room = currentRoom();
      if (!room || !canRunRoomCommand(room, userId)) return;
      if (isHost(room, targetId)) return;

      removeMember(room, targetId);
      broadcastRoster(room);
    });

    // ungated on purpose: every tier broadcasts presence, including read. room wide
    // rather than per product, since a roster panel shows everyone regardless of product
    socket.on('updatePresence', (entry) => {
      relayToRoom('presenceChanged', { userId, entry });
    });

    socket.on('disconnect', () => {
      const room = currentRoom();
      if (!room || currentRoomId === null) return;

      if (isHost(room, userId)) {
        // no migration and no grace period: a blip is treated the same as leaving
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
