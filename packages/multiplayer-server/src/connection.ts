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

  // a placeholder until admission, which either seats this socket somewhere new or hands
  // it back the seat it is claiming. mutable for the same reason the two below are: which
  // seat a socket occupies is a fact about the connection, not about the socket
  let currentUserId: UserId = randomUUID();
  let currentRoomId: RoomId | null = null;
  // tracked because socket.io has no "leave every channel but the room" primitive
  let currentProductId: ProductId | null = null;

  const userId = () => currentUserId;

  const room = () =>
    currentRoomId === null ? undefined : rooms.get(currentRoomId);

  // every event this socket sends is the room being used, which is what the sweep reads.
  // one place rather than four registries, so an event added later counts without being
  // remembered. admission stamps itself: there is no room to stamp until it lands
  socket.onAny(() => {
    const current = room();
    if (current) current.lastActiveAt = Date.now();
  });

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
      clearPresence(current, productId, currentUserId);
      announceToProduct(productId, 'peerLeftProduct', {
        userId: currentUserId,
      });
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
    const presence = ensurePresence(current, productId, currentUserId);
    relayToProduct(productId, 'peerEnteredProduct', {
      userId: currentUserId,
      presence,
    });
  };

  const broadcastRoster = (current: Room) => {
    if (currentRoomId === null) return;
    io.to(currentRoomId).emit('rosterChanged', current.data);
  };

  const presenceTarget = () => {
    const current = room();
    if (!current || currentProductId === null) return;
    return {
      room: current,
      productId: currentProductId,
      userId: currentUserId,
    };
  };

  const peerPresence = (current: Room, productId: ProductId) => {
    const peers: Record<UserId, ProductPresence> = {};
    for (const [peerId, entry] of Object.entries(
      presenceIn(current, productId),
    )) {
      if (peerId === currentUserId) continue;
      peers[peerId] = entry;
    }
    return peers;
  };

  /** absent is an invariant break: a tier is something only a roster entry carries */
  const commander = (current: Room): RosterEntry | undefined => {
    const entry = current.data.roster[currentUserId];
    if (!entry) {
      console.error(
        `multiplayer: invariant broken, "${currentUserId}" cleared a tier gate with no roster entry`,
      );
    }
    return entry;
  };

  /** back to a live socket in no room, or presence would keep reaching a room it left */
  const leaveRoomChannels = () => {
    if (currentRoomId === null) return;
    if (currentProductId !== null) leaveProduct(currentProductId);
    socket.leave(currentRoomId);
    currentRoomId = null;
    currentProductId = null;
  };

  const evict = (by: RosterEntry) => {
    if (currentRoomId === null) return;
    leaveRoomChannels();
    socket.emit('kicked', { by });
  };

  /**
   * Taking over a seat this socket has proven is its own. The index moves with it, or the
   * room commands aimed at the reclaimed id would go on reaching a socket that is gone.
   */
  const claimSeat = (nextUserId: UserId) => {
    const member = connections.get(currentUserId);
    connections.delete(currentUserId);
    currentUserId = nextUserId;
    if (member) connections.set(currentUserId, member);
  };

  connections.set(currentUserId, {
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
    claimSeat,
    enterProduct,
    leaveProduct,
    leaveRoomChannels,

    relayToRoom,
    relayToProduct,
    broadcastRoster,

    presenceTarget,
    peerPresence,

    commander,
  };
};
