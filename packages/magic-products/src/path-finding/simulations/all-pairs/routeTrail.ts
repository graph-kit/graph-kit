import { GNode, Graph, GraphPath, walkFromTo } from '@magic/shared/graph';

/**
 * the route for each matrix cell for FW all pairs
 *
 * remembers the previous trail cus otherwise it would show the new trail in the explainer and its confusing
 */
export type RouteTrail = Readonly<
  Record<GNode['id'], Readonly<Record<GNode['id'], GraphPath>>>
>;

export const routeBetween = (
  graph: Graph,
  trail: RouteTrail,
  from: GNode['id'],
  to: GNode['id'],
): GraphPath => {
  const stored = trail[from]?.[to] ?? [];
  return walkFromTo(graph, stored, from, to) ? stored : [];
};
