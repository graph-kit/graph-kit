import {
  GEdge,
  GNode,
  Graph,
  GraphPath,
  walkFromTo,
} from '@magic/shared/graph';

/** how each cell of the table got its value: a direct edge, or the pivot it detours via */
export type RouteTrail = {
  directEdge: Readonly<
    Record<GNode['id'], Readonly<Record<GNode['id'], GEdge['id']>>>
  >;
  viaPivot: Readonly<
    Record<GNode['id'], Readonly<Record<GNode['id'], GNode['id']>>>
  >;
};

const followTrail = (
  trail: RouteTrail,
  from: GNode['id'],
  to: GNode['id'],
): GraphPath => {
  // a table holding a negative cycle can send the trail round in circles
  const cellsAlreadyFollowed = new Set<string>();

  const follow = (start: GNode['id'], end: GNode['id']): GraphPath => {
    const cell = `${start} ${end}`;
    if (cellsAlreadyFollowed.has(cell)) return [];
    cellsAlreadyFollowed.add(cell);

    const pivot = trail.viaPivot[start]?.[end];
    if (pivot === undefined) {
      const edge = trail.directEdge[start]?.[end];
      return edge === undefined ? [] : [edge];
    }

    return [...follow(start, pivot), ...follow(pivot, end)];
  };

  return follow(from, to);
};

/** the trail's route for a pair, or nothing when what it leads to is not that trip */
export const routeBetween = (
  graph: Graph,
  trail: RouteTrail,
  from: GNode['id'],
  to: GNode['id'],
): GraphPath => {
  const followed = followTrail(trail, from, to);
  return walkFromTo(graph, followed, from, to) ? followed : [];
};
