import {
  ProductId,
  RosterEntry,
  Seat,
  SeatToken,
  UserId,
} from '@multiplayer/protocol/room';
import {
  AssignableTier,
  DEFAULT_TIER,
  PRODUCT_WRITE_FLOOR,
  ROOM_COMMAND_FLOOR,
  Tier,
  canSetTier,
  meetsFloor,
} from '@multiplayer/protocol/tiers';

import { Room } from './rooms.ts';

export const addMember = (
  room: Room,
  options: { userId: UserId; token: SeatToken; displayName: string },
): RosterEntry => {
  const entry: RosterEntry = {
    userId: options.userId,
    displayName: options.displayName,
    tier: DEFAULT_TIER,
    productId: null,
    connected: true,
  };
  room.data.roster[options.userId] = entry;
  room.seatTokens[options.userId] = options.token;
  return entry;
};

/** roster removal only; a non host leaving never disbands anything */
export const removeMember = (room: Room, userId: UserId): void => {
  delete room.data.roster[userId];
  delete room.seatTokens[userId];
};

/**
 * The seat stays, its owner does not. Everything that makes them who they are to the rest
 * of the room is left untouched, which is the entire point: this is what they come back to.
 */
export const markDisconnected = (room: Room, userId: UserId): void => {
  const entry = room.data.roster[userId];
  if (!entry) return;
  entry.connected = false;
};

/**
 * Sitting back down. The token is the whole test, and a seat that still has somebody in
 * it is no exception: only one client can hold a token, so a live claim is that same
 * person arriving on a newer tab, and the seat is theirs to take back. Whoever was in it
 * is moved out by the caller, which is the only part of this a room cannot do alone.
 */
export const reclaimSeat = (
  room: Room,
  seat: Seat,
): RosterEntry | undefined => {
  const entry = room.data.roster[seat.userId];
  if (!entry) return;
  if (room.seatTokens[seat.userId] !== seat.token) return;

  entry.connected = true;
  return entry;
};

/** host is a singleton set at room creation and never reassigned */
export const isHost = (room: Room, userId: UserId): boolean =>
  room.data.hostId === userId;

const tierOf = (room: Room, userId: UserId): Tier | undefined =>
  room.data.roster[userId]?.tier;

/** one flat rule for every product layer write, for every product */
export const canWriteProduct = (room: Room, userId: UserId): boolean => {
  const tier = tierOf(room, userId);
  return tier !== undefined && meetsFloor(tier, PRODUCT_WRITE_FLOOR);
};

/** moveUser and kickUser share this floor; setTier uses the ordinal rule instead */
export const canRunRoomCommand = (room: Room, userId: UserId): boolean => {
  const tier = tierOf(room, userId);
  return tier !== undefined && meetsFloor(tier, ROOM_COMMAND_FLOOR);
};

/** ungated: a display name authorizes nothing */
export const setMemberDisplayName = (
  room: Room,
  userId: UserId,
  displayName: string,
): boolean => {
  const entry = room.data.roster[userId];
  if (!entry) return false;
  entry.displayName = displayName;
  return true;
};

/** records where a member navigated, which is what server state relays route off */
export const setMemberProduct = (
  room: Room,
  userId: UserId,
  productId: ProductId,
): void => {
  const entry = room.data.roster[userId];
  if (!entry) return;
  entry.productId = productId;
};

/** false when refused, so the caller can skip the rebroadcast */
export const setTier = (
  room: Room,
  callerId: UserId,
  targetId: UserId,
  nextTier: AssignableTier,
): boolean => {
  const callerTier = tierOf(room, callerId);
  const target = room.data.roster[targetId];
  if (!callerTier || !target) return false;
  if (!canSetTier(callerTier, target.tier, nextTier)) return false;

  target.tier = nextTier;
  return true;
};
