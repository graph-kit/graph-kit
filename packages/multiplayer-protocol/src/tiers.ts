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

/** every product layer write, for every product, forever */
export const PRODUCT_WRITE_FLOOR: Tier = 'write';

/** moveUser and kickUser share this floor, setTier uses the ordinal rule instead */
export const ROOM_COMMAND_FLOOR: Tier = 'admin';

export const DEFAULT_TIER: Tier = 'read';

// three independent conditions: strictly-below alone would let Write assign Read, and
// without the host guard an Admin could demote the host and orphan disband-on-disconnect
export const canSetTier = (
  callerTier: Tier,
  targetCurrentTier: Tier,
  nextTier: AssignableTier,
): boolean =>
  meetsFloor(callerTier, ROOM_COMMAND_FLOOR) &&
  targetCurrentTier !== 'host' &&
  rankOf(callerTier) > rankOf(nextTier);
