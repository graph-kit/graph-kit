export const TIERS = ['host', 'admin', 'write', 'read'] as const;

export type Tier = (typeof TIERS)[number];

/** host is a singleton assigned only at room creation, so it is never a target of setTier */
export const ASSIGNABLE_TIERS = ['admin', 'write', 'read'] as const;

export type AssignableTier = (typeof ASSIGNABLE_TIERS)[number];

// exhaustive so adding a tier forces every ordinal decision below to be revisited
const tierToRank: Record<Tier, number> = {
  host: 3,
  admin: 2,
  write: 1,
  read: 0,
};

/** higher outranks lower; the only thing tier comparisons are built on */
export const rankOf = (tier: Tier): number => tierToRank[tier];

/** inclusive: a tier meets its own floor */
export const meetsFloor = (tier: Tier, floor: Tier): boolean =>
  rankOf(tier) >= rankOf(floor);

/**
 * every product layer write, for every product, forever. read sits below it, so a member
 * holding read is rejected here as well as a socket that never joined
 */
export const PRODUCT_WRITE_FLOOR: Tier = 'write';

/** moveUser and kickUser share this floor */
export const ROOM_COMMAND_FLOOR: Tier = 'admin';

/** its own constant, so lowering the room command floor never also hands out the roster */
export const TIER_ASSIGNMENT_FLOOR: Tier = 'admin';

/** the lowest tier, so joining a room grants a view and nothing else until assigned higher */
export const DEFAULT_TIER: Tier = 'read';

/**
 * strict on the target, inclusive on the payload: an admin may raise someone to admin but
 * never take it back off one
 */
export const canSetTier = (
  callerTier: Tier,
  targetCurrentTier: Tier,
  nextTier: AssignableTier,
): boolean =>
  meetsFloor(callerTier, TIER_ASSIGNMENT_FLOOR) &&
  targetCurrentTier !== 'host' &&
  rankOf(callerTier) > rankOf(targetCurrentTier) &&
  rankOf(callerTier) >= rankOf(nextTier);
