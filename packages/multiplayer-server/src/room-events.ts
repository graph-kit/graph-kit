import { randomUUID } from 'node:crypto';

import { JoinResult } from '@multiplayer/protocol/events';
import { RoomId, Seat, SeatToken, UserId } from '@multiplayer/protocol/room';

import { generateRoomId, normalizeRoomId } from './room-id.ts';
import { Room, createRoom } from './rooms.ts';
import {
  addMember,
  canRunRoomCommand,
  isHost,
  markDisconnected,
  reclaimSeat,
  removeMember,
  setMemberDisplayName,
  setTier,
} from './roster.ts';
import { Connection } from './types.ts';

const joinResultFor = (
  room: Room,
  roomId: RoomId,
  userId: UserId,
  seatToken: SeatToken,
): JoinResult => ({ joined: true, roomId, userId, seatToken, data: room.data });

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
    claimSeat,
    enterProduct,
    leaveProduct,
    leaveRoomChannels,
    broadcastRoster,
    commander,
  } = connection;

  socket.on(
    'startRoom',
    ({ displayName, productId: target, doc }, callback) => {
      const newRoomId = generateRoomId(rooms.has);
      const seatToken: SeatToken = randomUUID();
      const created = createRoom({
        hostId: userId(),
        hostToken: seatToken,
        displayName,
        productId: target,
        doc,
      });

      rooms.set(newRoomId, created);
      joinRoom(newRoomId);
      enterProduct(target);

      callback({
        roomId: newRoomId,
        userId: userId(),
        seatToken,
        data: created.data,
      });
    },
  );

  /**
   * Admission and re-admission alike: which product the member lands on is what
   * enterProduct answers, and whether the seat is the one they left is what the claim
   * decides. A claim that cannot be honoured is not a refusal, it is a new seat.
   */
  const admit = (
    current: Room,
    displayName: string,
    seat: Seat | undefined,
  ) => {
    if (seat && reclaimSeat(current, seat)) {
      claimSeat(seat.userId);
      // a rename made while they were gone is theirs, and the roster never heard it
      setMemberDisplayName(current, seat.userId, displayName);
      return seat.token;
    }

    const seatToken: SeatToken = randomUUID();
    addMember(current, { userId: userId(), token: seatToken, displayName });
    return seatToken;
  };

  socket.on('joinRoom', ({ roomId: target, displayName, seat }, callback) => {
    const targetRoomId = normalizeRoomId(target);
    const found = rooms.get(targetRoomId);
    if (!found) return callback({ joined: false });

    joinRoom(targetRoomId);
    // stamped here rather than by the catch-all, which runs before there is a room to stamp
    found.lastActiveAt = Date.now();
    const seatToken = admit(found, displayName, seat);

    callback(joinResultFor(found, targetRoomId, userId(), seatToken));
    broadcastRoster(found);
  });

  /**
   * The departure that was chosen. Everything a disconnect leaves standing in the hope of
   * a return is torn down here instead, because there is nothing to come back for.
   */
  socket.on('leaveRoom', () => {
    const current = room();
    const currentRoomId = roomId();
    if (!current || currentRoomId === null) return;

    if (isHost(current, userId())) {
      // ahead of the announcement, so the one member who already knows is the one it
      // does not reach, and their cursor is cleared for everybody it does
      leaveRoomChannels();
      io.to(currentRoomId).emit('roomDisbanded', { reason: 'hostLeft' });
      rooms.delete(currentRoomId);
      return;
    }

    removeMember(current, userId());
    // ahead of the channel teardown, which is what the broadcast travels on
    broadcastRoster(current);
    leaveRoomChannels();
  });

  // ungated: renaming yourself authorizes nothing, and being able to do it mid session
  // is what keeps an unnamed join from being a dead end
  socket.on('setDisplayName', ({ displayName }) => {
    const current = room();
    if (!current) return;
    if (!setMemberDisplayName(current, userId(), displayName)) return;
    broadcastRoster(current);
  });

  socket.on('setTier', ({ userId: targetId, tier }) => {
    const current = room();
    if (!current) return;
    if (!setTier(current, userId(), targetId, tier)) return;
    broadcastRoster(current);
  });

  socket.on('moveUser', ({ userId: targetId, productId: target }) => {
    const current = room();
    if (!current || !canRunRoomCommand(current, userId())) return;
    if (!current.data.roster[targetId]) return;

    const by = commander(current);
    if (!by) return;

    connections.get(targetId)?.moveTo(target, by);
  });

  socket.on('kickUser', ({ userId: targetId }) => {
    const current = room();
    if (!current || !canRunRoomCommand(current, userId())) return;
    if (isHost(current, targetId)) return;

    const by = commander(current);
    if (!by) return;

    removeMember(current, targetId);
    // ahead of the broadcast, so the roster the target last saw is the one it was still
    // in rather than an update that quietly erases them
    connections.get(targetId)?.evict(by);
    broadcastRoster(current);
  });

  /**
   * A drop, which is not a departure: the seat stays, marked empty, until its owner
   * reclaims it or the room times out around it. Only what is tied to being present goes.
   */
  socket.on('disconnect', () => {
    connections.delete(userId());

    const current = room();
    const currentRoomId = roomId();
    if (!current || currentRoomId === null) return;

    // presence is the one thing a disconnect does settle: a cursor nobody is behind and a
    // drag nobody is holding are not things to hold open for a return
    const onProduct = productId();
    if (onProduct !== null) leaveProduct(onProduct);

    markDisconnected(current, userId());
    broadcastRoster(current);
  });
};
