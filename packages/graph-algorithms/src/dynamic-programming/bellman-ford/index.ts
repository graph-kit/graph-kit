import Fraction from 'fraction.js';

import type { Edge, Node } from '../types.ts';

type Arc = {
  edgeId: string;
  from: string;
  to: string;
  weight: Fraction;
};

export type NegativeCycle = {
  nodes: string[];
  edges: string[];
};

export type BellmanFordResult =
  | {
      negativeCycle: false;
      distances: Record<string, Fraction | undefined>;
    }
  | {
      negativeCycle: true;
      witnessEdge: string;
      cycle: NegativeCycle;
    };

const toArcs = (
  edges: Edge[],
  directed: boolean,
  nodeIds: Set<string>,
): Arc[] => {
  const arcs: Arc[] = [];

  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;

    const forward = {
      edgeId: edge.id,
      from: edge.source,
      to: edge.target,
      weight: edge.weight,
    };

    arcs.push(forward);
    if (directed) continue;
    arcs.push({ ...forward, from: edge.target, to: edge.source });
  }

  return arcs;
};

const lapThrough = (start: string, arrivedOn: Map<string, Arc>): Arc[] => {
  const seen = new Set<string>();

  let entry = start;
  while (!seen.has(entry)) {
    seen.add(entry);
    entry = arrivedOn.get(entry)!.from;
  }

  const lap: Arc[] = [];

  let node = entry;
  do {
    const arc = arrivedOn.get(node)!;
    lap.push(arc);
    node = arc.from;
  } while (node !== entry);

  return lap.reverse();
};

/**
 * Finds the shortest distance from `source` to every node, using the
 * Bellman-Ford algorithm. Negative weights allowed.
 *
 * Sweeps every edge once per pass, keeping any distance a pass can improve.
 * After one pass per node less one, every shortest path that exists has been
 * found, so an edge that still improves on a further pass proves a negative
 * cycle: a loop a walker could ride forever, getting cheaper every lap. No
 * shortest path exists at all in that case, so the cycle is reported in place
 * of distances that would be meaningless.
 *
 * A negative cycle the source cannot reach is not reported, since it cannot
 * undercut any trip the source can actually take.
 *
 * @complexity
 * Time:  O(VE)   Θ(VE)   Ω(E)
 * Space: O(V + E)   Θ(V + E)   Ω(V + E)
 *
 * where V = number of vertices and E = number of edges.
 */
export const bellmanFord = (
  nodes: Node[],
  edges: Edge[],
  source: string,
  options: { directed?: boolean } = {},
): BellmanFordResult => {
  const { directed = true } = options;

  const distances: Record<string, Fraction | undefined> = {};
  for (const node of nodes) distances[node.id] = undefined;

  if (!(source in distances)) return { negativeCycle: false, distances };

  distances[source] = new Fraction(0);

  const arcs = toArcs(edges, directed, new Set(Object.keys(distances)));

  const arrivedOn = new Map<string, Arc>();

  const relaxation = (arc: Arc) => {
    const reachedFrom = distances[arc.from];
    if (reachedFrom === undefined) return;

    const offered = reachedFrom.add(arc.weight);
    const current = distances[arc.to];
    if (current !== undefined && current.lte(offered)) return;

    return offered;
  };

  for (let pass = 1; pass < nodes.length; pass++) {
    let improved = false;

    for (const arc of arcs) {
      const offered = relaxation(arc);
      if (offered === undefined) continue;

      distances[arc.to] = offered;
      arrivedOn.set(arc.to, arc);
      improved = true;
    }

    if (!improved) break;
  }

  const witness = arcs.find((arc) => relaxation(arc) !== undefined);

  if (witness) {
    arrivedOn.set(witness.to, witness);

    const lap = lapThrough(witness.to, arrivedOn);

    return {
      negativeCycle: true,
      witnessEdge: witness.edgeId,
      cycle: {
        nodes: lap.map((arc) => arc.from),
        edges: lap.map((arc) => arc.edgeId),
      },
    };
  }

  return { negativeCycle: false, distances };
};
