import {
  clearLocalStorage,
  readLocalStorage,
  writeLocalStorage,
} from '@core/utils/localStorage';
import { RoomId, Seat } from '@multiplayer/protocol/room';

/**
 * Keyed by room, because a seat only means anything in the room that issued it: hopping
 * to another room must not spend the seat waiting in the one behind you.
 */
const seatKey = (roomId: RoomId) => `multiplayer-seat-${roomId}`;

/**
 * Local storage rather than session: a seat belongs to the person, not to the tab that
 * happened to open it, and closing a tab is the most ordinary way there is to end up
 * reconnecting. Session storage cannot survive that, which made a reopened tab a
 * stranger to a seat that was still being held for it.
 *
 * Two tabs therefore read the same seat, and both will claim it. That is settled at the
 * server, where the token proves the claim and the newer tab takes the seat over.
 */
export const readSeat = (roomId: RoomId): Seat | undefined => {
  const stored = readLocalStorage(seatKey(roomId));
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
  writeLocalStorage(seatKey(roomId), JSON.stringify(seat));

export const clearSeat = (roomId: RoomId) => clearLocalStorage(seatKey(roomId));
