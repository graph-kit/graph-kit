import {
  clearSessionStorage,
  readSessionStorage,
  writeSessionStorage,
} from '@core/utils/sessionStorage';
import { RoomId, Seat } from '@multiplayer/protocol/room';

/**
 * Keyed by room, because a seat only means anything in the room that issued it: hopping
 * to another room must not spend the seat waiting in the one behind you.
 */
const seatKey = (roomId: RoomId) => `multiplayer-seat-${roomId}`;

/**
 * Session storage rather than local: a seat belongs to the tab holding it. Two tabs on
 * one room are two people, and the server refuses a claim on a seat that is still live,
 * so sharing the store between them would cost the second tab a silent re-seat every
 * time. It survives what reconnecting is actually for, which is a refresh or a sleep.
 */
export const readSeat = (roomId: RoomId): Seat | undefined => {
  const stored = readSessionStorage(seatKey(roomId));
  if (!stored) return;

  try {
    const parsed: unknown = JSON.parse(stored);
    if (typeof parsed !== 'object' || parsed === null) return;
    const { userId, token } = parsed as Partial<Seat>;
    if (typeof userId !== 'string' || typeof token !== 'string') return;
    return { userId, token };
  } catch {
    // a claim that cannot be read is a claim not made, and the server hands back a fresh
    // seat either way. nothing here is worth telling anyone about
    return;
  }
};

export const writeSeat = (roomId: RoomId, seat: Seat) =>
  writeSessionStorage(seatKey(roomId), JSON.stringify(seat));

export const clearSeat = (roomId: RoomId) =>
  clearSessionStorage(seatKey(roomId));
