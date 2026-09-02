import colors, { Color } from '@core/utils/colors';

/**
 * the standardized vocabulary for node highlight colors. see {@link EdgeRole}
 * for the edge counterpart.
 *
 * a product maps its own domain concept onto a role, so that the same concept
 * wears the same color in every product. roles are named one level above any
 * single algorithm on purpose: 'visited' and 'queued' are breadth first search
 * words, while 'settled' and 'pending' cover breadth first search, depth first
 * search, dijkstra, prim and tree traversal alike.
 *
 * two conventions when mapping:
 *
 * - 'active' and 'anchor' describe one or two nodes. the rest describe sets.
 * - a product must not map two roles onto one state, or one role onto two
 *   states. a state that fits no role is a signal that the vocabulary is
 *   missing something, not a license to reach past this record for a color.
 */
export type NodeRole =
  | 'active'
  | 'candidate'
  | 'pending'
  | 'settled'
  | 'result'
  | 'anchor'
  | 'excluded'
  | 'violation';

/**
 * hues are spread deliberately so that roles a product is likely to show at the
 * same time stay distinguishable in both the light and dark presets. 'excluded'
 * is the one neutral, because a ruled out node should recede rather than
 * compete for attention
 */
export const nodeRoleColors = {
  /** is the algorithm processing this node right now? */
  active: colors.AMBER_500,
  /** is it being compared or considered this frame, but not yet chosen? */
  candidate: colors.CYAN_500,
  /** is it discovered and waiting in a queue, stack or frontier? */
  pending: colors.BLUE_500,
  /** is it finished, never to be revisited? */
  settled: colors.EMERALD_500,
  /** is it part of the answer being shown, like a shortest path or an mst? */
  result: colors.VIOLET_500,
  /** did the user pick it, like a start or end node? */
  anchor: colors.PINK_500,
  /** is it ruled out, invalid or unreachable? */
  excluded: colors.GRAY_500,
  /** does it prove the input is broken, like sitting on a negative cycle? */
  violation: colors.RED_500,
} as const satisfies Record<NodeRole, Color>;
