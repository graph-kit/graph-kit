import Fraction from 'fraction.js';

import type { Edge, Node } from '../types.ts';

type Parent = Map<string, string>;
type Rank = Map<string, number>;

/**
 * Finds a minimum spanning tree (MST) of a weighted graph using Kruskal's
 * algorithm. If the graph is disconnected, returns a minimum spanning forest
 * instead.
 *
 * Processes edges in non-decreasing order of weight, greedily adding each edge
 * that connects two previously disconnected components. A union-find data
 * structure with path compression is used to efficiently detect cycles.
 *
 * @complexity
 * Time:  O(E log E)   Θ(E log E)   Ω(E)
 * Space: O(V)         Θ(V)         Ω(V)
 *
 * where V = number of vertices and E = number of edges.
 */
export const kruskals = (nodes: readonly Node[], edges: readonly Edge[]) => {
  const find = (parent: Parent, nodeId: string): string => {
    if (parent.get(nodeId) !== nodeId) {
      parent.set(nodeId, find(parent, parent.get(nodeId)!));
    }
    return parent.get(nodeId)!;
  };

  const union = (
    parent: Parent,
    rank: Rank,
    nodeA: string,
    nodeB: string,
  ): boolean => {
    const rootA = find(parent, nodeA);
    const rootB = find(parent, nodeB);

    if (rootA === rootB) return false;

    const rankA = rank.get(rootA)!;
    const rankB = rank.get(rootB)!;

    if (rankA < rankB) {
      parent.set(rootA, rootB);
    } else if (rankA > rankB) {
      parent.set(rootB, rootA);
    } else {
      parent.set(rootB, rootA);
      rank.set(rootA, rankA + 1);
    }

    return true;
  };

  const sortedEdges = edges.toSorted((a, b) => a.weight.compare(b.weight));

  const parent: Parent = new Map();
  const rank: Rank = new Map();

  nodes.forEach((node) => {
    parent.set(node.id, node.id);
    rank.set(node.id, 0);
  });

  const mst: Edge[] = [];

  for (const edge of sortedEdges) {
    if (union(parent, rank, edge.source, edge.target)) {
      mst.push(edge);

      if (mst.length === nodes.length - 1) break;
    }
  }

  return {
    edges: mst,
    totalWeight: mst.reduce(
      (sum, edge) => sum.add(edge.weight),
      new Fraction(0),
    ),
    connected: mst.length === nodes.length - 1,
  };
};
