import { ServerContext } from './types.ts';

/**
 * Long enough that a room nobody is touching is a room nobody wants, short enough that an
 * abandoned one is not still holding its documents an hour later. Any event at all resets
 * it, presence included, so a member who so much as moves the mouse holds the room open.
 */
const ROOM_INACTIVE_MS = 120_000;
const ROOM_SWEEP_INTERVAL_MS = 15_000;

/** overridable so a test can watch a room expire without waiting out a real one */
export type RoomSweepOptions = {
  inactiveAfterMs?: number;
  sweepIntervalMs?: number;
};

/**
 * Rooms are held in memory, so nothing reclaims one that everybody walked away from. The
 * announcement goes out first: members can still be connected and simply idle, and a room
 * that vanished under them without a word reads as the app breaking.
 */
export const startRoomSweep = (
  { io, rooms }: ServerContext,
  options: RoomSweepOptions = {},
) => {
  const inactiveAfterMs = options.inactiveAfterMs ?? ROOM_INACTIVE_MS;

  const sweep = () => {
    const now = Date.now();
    for (const [roomId, room] of rooms.entries()) {
      if (now - room.lastActiveAt < inactiveAfterMs) continue;
      io.to(roomId).emit('roomDisbanded', { reason: 'inactivity' });
      rooms.delete(roomId);
    }
  };

  // unref'd: sweeping is never a reason for the process to stay alive
  setInterval(sweep, options.sweepIntervalMs ?? ROOM_SWEEP_INTERVAL_MS).unref();
};
