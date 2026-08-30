import { GEdge, GNode, Graph } from '@magic/shared/graph';
import Fraction from 'fraction.js';

/**
 * one direction of one edge, which is the unit all three algorithms relax. an
 * undirected edge yields two arcs, since either endpoint can be reached from
 * the other.
 *
 * the arc carries the edge id rather than leaving the caller to look one up per
 * relaxation, so a graph with parallel edges highlights the edge actually being
 * tested instead of whichever one happens to be found first
 */
export type Arc = {
  edgeId: GEdge['id'];
  from: GNode['id'];
  to: GNode['id'];
  /** the edge's own weight, carried across as the fraction it already is */
  weight: Fraction;
};

export const arcs = (graph: Graph): Arc[] => {
  const collected: Arc[] = [];

  for (const edge of graph.edges.value) {
    const forward = {
      edgeId: edge.id,
      from: edge.source,
      to: edge.target,
      weight: edge.weight,
    };
    collected.push(forward);
    if (graph.metadata.directed) continue;
    collected.push({ ...forward, from: edge.target, to: edge.source });
  }

  return collected;
};

/** the arcs leaving each node, so dijkstra can expand a node without a full scan */
export const arcsBySource = (graph: Graph): Record<GNode['id'], Arc[]> => {
  const bySource: Record<GNode['id'], Arc[]> = {};
  for (const node of graph.nodes.value) bySource[node.id] = [];
  for (const arc of arcs(graph)) bySource[arc.from]?.push(arc);
  return bySource;
};

/**
 * the first edge that costs less than nothing, if there is one.
 *
 * dijkstra's whole claim is that a settled cost cannot be beaten, and a
 * negative edge is exactly what beats one. bellman ford and floyd warshall are
 * built for them, so this is a question about one algorithm rather than about
 * the graph being wrong
 */
export const negativeWeightEdge = (graph: Graph) =>
  graph.edges.value.find((edge) => edge.weight.lt(0));

/**
 * the edges of the path a distance arrived on, source first.
 *
 * the guard is not decoration: bellman ford keeps arriving arcs on a graph that
 * may hold a negative cycle, and a chain that loops would spin here rather than
 * anywhere a stack trace would point at
 */
export const pathTo = (
  arrivedOn: ReadonlyMap<GNode['id'], Arc>,
  node: GNode['id'],
): GEdge['id'][] => {
  const edges: GEdge['id'][] = [];
  const seen = new Set<GNode['id']>();

  for (let at = node; !seen.has(at);) {
    seen.add(at);
    const arc = arrivedOn.get(at);
    if (!arc) break;
    edges.push(arc.edgeId);
    at = arc.from;
  }

  return edges.reverse();
};
