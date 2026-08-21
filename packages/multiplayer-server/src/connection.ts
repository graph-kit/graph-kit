import { randomUUID } from 'node:crypto';

import { ServerToClientEvents } from '@multiplayer/protocol/events';
import {
  ProductId,
  ProductPresence,
  RoomId,
  RosterEntry,
  UserId,
} from '@multiplayer/protocol/room';

import { productChannel } from './channels.ts';
import { clearPresence, ensurePresence, presenceIn } from './presence.ts';
import { Room } from './rooms.ts';
import { Connection, MemberSocket, Relay, ServerContext } from './types.ts';

export const createConnection = (
  server: ServerContext,
  socket: MemberSocket,
): Connection => {
  const { io, rooms, connections } = server;

  const userId: UserId = randomUUID();
  let currentRoomId: RoomId | null = null;
  // tracked because socket.io has no "leave every channel but the room" primitive
  let currentProductId: ProductId | null = null;

  const room = () =>
    currentRoomId === null ? undefined : rooms.get(currentRoomId);

  const relayToRoom = <Event extends keyof ServerToClientEvents>(
    event: Event,
    ...args: Relay<Event>
  ) => {
    if (currentRoomId === null) return;
    socket.broadcast.to(currentRoomId).emit(event, ...args);
  };

  const relayToProduct = <Event extends keyof ServerToClientEvents>(
    productId: ProductId,
    event: Event,
    ...args: Relay<Event>
  ) => {
    if (currentRoomId === null) return;
    socket.broadcast
      .to(productChannel(currentRoomId, productId))
      .emit(event, ...args);
  };

  /** io rather than a relay: departures are sent when this socket is already on its way out */
  const announceToProduct = <Event extends keyof ServerToClientEvents>(
    productId: ProductId,
    event: Event,
    ...args: Relay<Event>
  ) => {
    if (currentRoomId === null) return;
    io.to(productChannel(currentRoomId, productId)).emit(event, ...args);
  };

  const joinRoom = (roomId: RoomId) => {
    currentRoomId = roomId;
    socket.join(roomId);
  };

  const leaveProduct = (productId: ProductId) => {
    if (currentRoomId === null) return;

    const current = room();
    if (current) {
      clearPresence(current, productId, userId);
      announceToProduct(productId, 'peerLeftProduct', { userId });
    }

    socket.leave(productChannel(currentRoomId, productId));
    if (currentProductId === productId) currentProductId = null;
  };

  const enterProduct = (productId: ProductId) => {
    if (currentRoomId === null) return;
    if (currentProductId !== null) leaveProduct(currentProductId);
    currentProductId = productId;
    socket.join(productChannel(currentRoomId, productId));

    const current = room();
    if (!current) return;

    // recorded before announced, so the next arrival is handed this member too
    const presence = ensurePresence(current, productId, userId);
    relayToProduct(productId, 'peerEnteredProduct', { userId, presence });
  };

  const broadcastRoster = (current: Room) => {
    if (currentRoomId === null) return;
    io.to(currentRoomId).emit('rosterChanged', current.data);
  };

  const presenceTarget = () => {
    const current = room();
    if (!current || currentProductId === null) return;
    return { room: current, productId: currentProductId };
  };

  const peerPresence = (current: Room, productId: ProductId) => {
    const peers: Record<UserId, ProductPresence> = {};
    for (const [peerId, entry] of Object.entries(
      presenceIn(current, productId),
    )) {
      if (peerId === userId) continue;
      peers[peerId] = entry;
    }
    return peers;
  };

  /** absent is an invariant break: a tier is something only a roster entry carries */
  const commander = (current: Room): RosterEntry | undefined => {
    const entry = current.data.roster[userId];
    if (!entry) {
      console.error(
        `multiplayer: invariant broken, "${userId}" cleared a tier gate with no roster entry`,
      );
    }
    return entry;
  };

  /** back to a live socket in no room, or presence would keep reaching a room it left */
  const evict = (by: RosterEntry) => {
    if (currentRoomId === null) return;
    if (currentProductId !== null) leaveProduct(currentProductId);
    socket.leave(currentRoomId);
    currentRoomId = null;
    currentProductId = null;
    socket.emit('kicked', { by });
  };

  connections.set(userId, {
    evict,
    moveTo: (productId, by) => socket.emit('movedToProduct', { productId, by }),
  });

  return {
    server,
    socket,
    userId,

    roomId: () => currentRoomId,
    room,
    productId: () => currentProductId,

    joinRoom,
    enterProduct,
    leaveProduct,

    relayToRoom,
    relayToProduct,
    broadcastRoster,

    presenceTarget,
    peerPresence,

    commander,
  };
};
