import colors, { Color } from '@core/utils/colors';

/**
 * the standardized vocabulary for edge highlight colors.
 *
 * the edge counterpart to {@link NodeRole}, and a separate vocabulary rather
 * than a reuse of that one, because the interesting states of an edge are not
 * the interesting states of a node. a node is somewhere the algorithm stands,
 * so it is explored, queued or finished. an edge is a choice the algorithm
 * makes, so it is crossed, kept, or rejected.
 *
 * two conventions when mapping:
 *
 * - 'active' and 'crossing' describe one edge at a time. the rest describe sets.
 * - a product must not map two roles onto one state, or one role onto two
 *   states. a state that fits no role is a signal that the vocabulary is
 *   missing something, not a license to reach past this record for a color.
 */
export type EdgeRole =
  | 'active'
  | 'crossing'
  | 'weighing'
  | 'crossed'
  | 'tree'
  | 'result'
  | 'rejected'
  | 'violation';

/**
 * deliberately aligned with {@link nodeRoleColors}, so that an edge and a node
 * in the same situation read as one thing: the edge being crossed is the same
 * amber as the node it leads to, and a rejected edge greys out just like an
 * excluded node.
 */
export const edgeRoleColors = {
  /** is the algorithm examining this one edge right now? */
  active: colors.RED_700,
  /** is the algorithm crossing this edge right now? */
  crossing: colors.AMBER_500,
  /** is it being weighed against other edges this frame, but not yet taken? */
  weighing: colors.CYAN_500,
  /** has it been crossed at some point, tree edge or not? */
  crossed: colors.BLUE_500,
  /** is it part of the structure being built, like a traversal or partial mst? */
  tree: colors.EMERALD_500,
  /** is it part of the answer being shown, like a shortest path or final mst? */
  result: colors.VIOLET_500,
  /** has it been ruled out, like an edge that would close a cycle? */
  rejected: colors.GRAY_500,
  /** does it prove the input is broken, like closing a negative cycle? */
  violation: colors.RED_500,
} as const satisfies Record<EdgeRole, Color>;
