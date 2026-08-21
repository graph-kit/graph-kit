import { ProductId, RosterEntry, UserId } from '@multiplayer/protocol/room';
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
  options: { userId: UserId; displayName: string },
): RosterEntry => {
  const entry: RosterEntry = {
    userId: options.userId,
    displayName: options.displayName,
    tier: DEFAULT_TIER,
    productId: null,
  };
  room.data.roster[options.userId] = entry;
  return entry;
};

/** roster removal only; a non host leaving never disbands anything */
export const removeMember = (room: Room, userId: UserId): void => {
  delete room.data.roster[userId];
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
