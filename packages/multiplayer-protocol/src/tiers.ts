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

export const rankOf = (tier: Tier) => tierToRank[tier];

export const meetsFloor = (tier: Tier, floor: Tier) =>
  rankOf(tier) >= rankOf(floor);

/** every product layer write, for every product, forever */
export const PRODUCT_WRITE_FLOOR: Tier = 'write';

/** moveUser and kickUser share this floor, setTier uses the ordinal rule instead */
export const ROOM_COMMAND_FLOOR: Tier = 'admin';

export const DEFAULT_TIER: Tier = 'read';

/**
 * three independent conditions. the floor is not implied by the ordinal rule, since
 * strictly-below alone would let a Write user assign Read. the host guard is not in the
 * spec but is required for coherence: without it an Admin could demote the host, which
 * would orphan disband-on-host-disconnect.
 */
export const canSetTier = (
  callerTier: Tier,
  targetCurrentTier: Tier,
  nextTier: AssignableTier,
) =>
  meetsFloor(callerTier, ROOM_COMMAND_FLOOR) &&
  targetCurrentTier !== 'host' &&
  rankOf(callerTier) > rankOf(nextTier);
