import { GEdge, GNode, Graph } from './types.ts';

/**
 * an ordered run of edges, named by id, each one starting where the last ended.
 *
 * a separate name from "some edge ids" on purpose: a path is the answer to how
 * a cost got paid, so its order carries meaning and the nodes between its edges
 * are part of what it is. a set of edges that merely happen to be interesting
 * together, like every edge leaving a node, is not one of these.
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
 * not chain, name an edge the graph does not have, or there are none at all.
 *
 * refusing rather than guessing is the point. a caller is usually about to
 * paint this on the canvas, and a route drawn through nodes it never went
 * through is worse than one not drawn: the reader has no way to tell.
 *
 * reads the edge list off the graph rather than asking it to resolve each id,
 * so an algorithm can call this with nothing but the nodes and edges in hand.
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

  // a walk may pass through a node more than once, but it is one node on the
  // canvas, so the ordered set is what a caller wants to paint
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

/**
 * the walk these edges make, if it is the trip from one node to another that it
 * is being claimed to be.
 *
 * the check anything rebuilt from a trail needs. a trail is walked backwards
 * through whatever wrote it, and a table or a distance row holding a negative
 * cycle can send that walk around a loop instead of home, leaving a run of
 * edges that is a real walk but not the trip anyone asked about. showing it
 * would be pointing at a route from the wrong place and saying it starts here.
 */
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
 * the walk, if these edges make one that leaves `node` and comes back to it.
 *
 * what a negative cycle has to pass before it is painted: the diagonal of a
 * table, or an edge that still relaxes, is proof enough that a loop exists, but
 * the trail rebuilding it can be stale, and a loop that does not come back to
 * the node it is claimed about is not the proof anyone is being shown.
 */
export const walkLoopAt = (graph: Graph, path: GraphPath, node: GNode['id']) =>
  walkFromTo(graph, path, node, node);
