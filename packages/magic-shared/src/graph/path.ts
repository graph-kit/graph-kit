import { GEdge, GNode, Graph } from './types.ts';

/**
 * an ordered run of edges, named by id, each one starting where the last ended.
 *
 */
export type GraphPath = readonly GEdge['id'][];

/** a {@link GraphPath} resolved against the graph it was read off */
export type Walk = {
  /** the edges, in the order they are crossed */
  edges: readonly GEdge[];
  /** every node the walk touches, in the order it first reaches them */
  nodeIds: readonly GNode['id'][];
  /** whether it comes back to where it started, which is what makes it a loop */
  closed: boolean;
  /** whether it passes through a node twice, the start of a loop aside */
  repeatsANode: boolean;
};

/**
 * resolves a path into the walk it describes, or `undefined` when the edges do
 * not chain, name an edge the graph does not have, or there are none at all
 *
 */
export const walkPath = (graph: Graph, path: GraphPath): Walk | undefined => {
  if (path.length === 0) return undefined;

  const edgeById = new Map(graph.edges.value.map((edge) => [edge.id, edge]));

  const edges: GEdge[] = [];
  for (const id of path) {
    const edge = edgeById.get(id);
    if (!edge) return undefined;
    edges.push(edge);
  }

  const start = edges[0].source;

  // a walk may pass through a node more than once,but that only needs to be one time on the canvas
  // so the ordered set is what a caller wants to paint
  const nodeIds = new Set<GNode['id']>([start]);

  let at = start;
  for (const edge of edges) {
    if (edge.source !== at) return undefined;
    at = edge.target;
    nodeIds.add(at);
  }

  const closed = at === start;

  return {
    edges,
    nodeIds: [...nodeIds],
    closed,
    repeatsANode: nodeIds.size < edges.length + (closed ? 0 : 1),
  };
};

export const walkFromTo = (
  graph: Graph,
  path: GraphPath,
  from: GNode['id'],
  to: GNode['id'],
): Walk | undefined => {
  const walk = walkPath(graph, path);
  if (!walk) return undefined;

  const startsRight = walk.edges[0].source === from;
  const endsRight = walk.edges[walk.edges.length - 1].target === to;

  return startsRight && endsRight ? walk : undefined;
};

/**
 * the walk, if these edges make one that leaves a `node` and comes back to it
 *
 */
export const walkLoopAt = (graph: Graph, path: GraphPath, node: GNode['id']) =>
  walkFromTo(graph, path, node, node);
