import { GEdge, GNode, Graph } from '@magic/shared/graph';

export const edgesLeavingEachNode = (
  graph: Graph,
): Map<GNode['id'], GEdge[]> => {
  const leaving = new Map<GNode['id'], GEdge[]>();
  for (const node of graph.nodes.value) leaving.set(node.id, []);
  for (const edge of graph.edges.value) leaving.get(edge.source)?.push(edge);
  return leaving;
};

export const findNegativeWeightEdge = (graph: Graph) =>
  graph.edges.value.find((edge) => edge.weight.lt(0));

export const edgeIdsAlongPathTo = (
  arrivalEdgeByNode: ReadonlyMap<GNode['id'], GEdge>,
  node: GNode['id'],
): GEdge['id'][] => {
  const edgeIds: GEdge['id'][] = [];
  const visited = new Set<GNode['id']>();

  // a negative cycle makes the arrival chain loop, so walk each node once
  for (let at = node; !visited.has(at);) {
    visited.add(at);
    const arrivedOn = arrivalEdgeByNode.get(at);
    if (!arrivedOn) break;
    edgeIds.push(arrivedOn.id);
    at = arrivedOn.source;
  }

  return edgeIds.reverse();
};
