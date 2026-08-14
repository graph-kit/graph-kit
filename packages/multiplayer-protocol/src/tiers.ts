export const TIERS = ['host', 'admin', 'write'] as const;

export type Tier = (typeof TIERS)[number];

/** host is a singleton assigned only at room creation, so it is never a target of setTier */
export const ASSIGNABLE_TIERS = ['admin', 'write'] as const;

export type AssignableTier = (typeof ASSIGNABLE_TIERS)[number];

// exhaustive so adding a tier forces every ordinal decision below to be revisited
const tierToRank: Record<Tier, number> = {
  host: 2,
  admin: 1,
  write: 0,
};

/** higher outranks lower; the only thing tier comparisons are built on */
export const rankOf = (tier: Tier): number => tierToRank[tier];

/** inclusive: a tier meets its own floor */
export const meetsFloor = (tier: Tier, floor: Tier): boolean =>
  rankOf(tier) >= rankOf(floor);

/**
 * every product layer write, for every product, forever. no tier sits below it yet, so
 * this only rejects non members until read only mode lands
 * https://github.com/graph-kit/graph-kit/issues/883
 */
export const PRODUCT_WRITE_FLOOR: Tier = 'write';

/** moveUser and kickUser share this floor, setTier uses the ordinal rule instead */
export const ROOM_COMMAND_FLOOR: Tier = 'admin';

/** the lowest tier, so joining a room grants product writes */
export const DEFAULT_TIER: Tier = 'write';

// three independent conditions. the floor is redundant while write is the lowest tier and
// load bearing again the moment one sits below it, and without the host guard an admin
// could demote the host and orphan disband-on-disconnect
export const canSetTier = (
  callerTier: Tier,
  targetCurrentTier: Tier,
  nextTier: AssignableTier,
): boolean =>
  meetsFloor(callerTier, ROOM_COMMAND_FLOOR) &&
  targetCurrentTier !== 'host' &&
  rankOf(callerTier) > rankOf(nextTier);
