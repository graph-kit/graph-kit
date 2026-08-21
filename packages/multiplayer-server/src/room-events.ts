import { JoinResult } from '@multiplayer/protocol/events';
import { RoomId, UserId } from '@multiplayer/protocol/room';

import { generateRoomId, normalizeRoomId } from './room-id.ts';
import { Room, createRoom } from './rooms.ts';
import {
  addMember,
  canRunRoomCommand,
  isHost,
  removeMember,
  setMemberDisplayName,
  setTier,
} from './roster.ts';
import { Connection } from './types.ts';

const joinResultFor = (
  room: Room,
  roomId: RoomId,
  userId: UserId,
): JoinResult => ({ joined: true, roomId, userId, data: room.data });

/** who is here: the roster, and the room lifecycle that writes it */
export const registerRoomEvents = (connection: Connection) => {
  const {
    server: { io, rooms, connections },
    socket,
    userId,
    room,
    roomId,
    productId,
    joinRoom,
    enterProduct,
    leaveProduct,
    broadcastRoster,
    commander,
  } = connection;

  socket.on(
    'startRoom',
    ({ displayName, productId: target, doc }, callback) => {
      const newRoomId = generateRoomId(rooms.has);
      const created = createRoom({
        hostId: userId,
        displayName,
        productId: target,
        doc,
      });

      rooms.set(newRoomId, created);
      joinRoom(newRoomId);
      enterProduct(target);

      callback({ roomId: newRoomId, userId, data: created.data });
    },
  );

  // admission only: which product the member lands on is what enterProduct answers
  socket.on('joinRoom', ({ roomId: target, displayName }, callback) => {
    const targetRoomId = normalizeRoomId(target);
    const found = rooms.get(targetRoomId);
    if (!found) return callback({ joined: false });

    joinRoom(targetRoomId);
    addMember(found, { userId, displayName });

    callback(joinResultFor(found, targetRoomId, userId));
    broadcastRoster(found);
  });

  // ungated: renaming yourself authorizes nothing, and being able to do it mid session
  // is what keeps an unnamed join from being a dead end
  socket.on('setDisplayName', ({ displayName }) => {
    const current = room();
    if (!current) return;
    if (!setMemberDisplayName(current, userId, displayName)) return;
    broadcastRoster(current);
  });

  socket.on('setTier', ({ userId: targetId, tier }) => {
    const current = room();
    if (!current) return;
    if (!setTier(current, userId, targetId, tier)) return;
    broadcastRoster(current);
  });

  socket.on('moveUser', ({ userId: targetId, productId: target }) => {
    const current = room();
    if (!current || !canRunRoomCommand(current, userId)) return;
    if (!current.data.roster[targetId]) return;

    const by = commander(current);
    if (!by) return;

    connections.get(targetId)?.moveTo(target, by);
  });

  socket.on('kickUser', ({ userId: targetId }) => {
    const current = room();
    if (!current || !canRunRoomCommand(current, userId)) return;
    if (isHost(current, targetId)) return;

    const by = commander(current);
    if (!by) return;

    removeMember(current, targetId);
    // ahead of the broadcast, so the roster the target last saw is the one it was still
    // in rather than an update that quietly erases them
    connections.get(targetId)?.evict(by);
    broadcastRoster(current);
  });

  socket.on('disconnect', () => {
    connections.delete(userId);

    const current = room();
    const currentRoomId = roomId();
    if (!current || currentRoomId === null) return;

    // ahead of the disband check: a host leaving takes the room with it, but everyone
    // else's release has to land while there is still a product to announce it on
    const onProduct = productId();
    if (onProduct !== null) leaveProduct(onProduct);

    if (isHost(current, userId)) {
      io.to(currentRoomId).emit('roomDisbanded');
      rooms.delete(currentRoomId);
      return;
    }

    removeMember(current, userId);
    broadcastRoster(current);
  });
};
