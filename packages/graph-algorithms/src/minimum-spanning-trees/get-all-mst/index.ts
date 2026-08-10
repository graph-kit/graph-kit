import { nullThrows } from '@core/utils/assert';
import Fraction from 'fraction.js';

import type { Edge, Node } from '../types.ts';
import { type ComponentEdge, allSpanningTrees } from './allSpanningTrees.ts';
import { type Parent, find, union } from './unionFind.ts';

export type GetAllMstsResult = {
  /** every MST of the graph, or every minimum spanning forest when disconnected */
  msts: Edge[][];
  /** the weight shared by every entry in `msts` */
  totalWeight: Fraction;
  /** whether the returned trees span every node, false for a forest */
  connected: boolean;
};

/**
 * Finds every minimum spanning tree (MST) of a weighted graph using a
 * generalized Kruskals algorithm. If the graph is disconnected, returns every
 * minimum spanning forest instead.
 *
 * Processes edges in non-decreasing order of weight. Edges with equal weight
 * are handled simultaneously: all valid spanning trees within each connected
 * equal-weight component are enumerated, and the Cartesian product of these
 * independent choices produces every possible MST.
 *
 * @complexity
 * Time:  O(E log E + T)   Θ(E log E + T)   Ω(E log E)
 * Space: O(E + T)         Θ(E + T)         Ω(V)
 *
 * where V = number of vertices, E = number of edges, and
 * T = total size of the output (the total number of edges across all
 * returned minimum spanning trees). In the worst case, the number of
 * minimum spanning trees is exponential in V.
 * CAUTION: FUNCTION IS EXPONENTIAL IN THE NUMBER OF EQUAL-WEIGHT EDGES, AND WILL BLOW UP IF GIVEN A LARGE GROUP!
 */
export const getAllMsts = (
  nodes: readonly Node[],
  edges: readonly Edge[],
): GetAllMstsResult => {
  const parent: Parent = new Map(nodes.map((node) => [node.id, node.id]));

  const sortedEdges = edges
    .filter((edge) => edge.source !== edge.target)
    .toSorted((a, b) => a.weight.compare(b.weight));

  const weightGroups: Edge[][] = [];
  sortedEdges.forEach((edge) => {
    const lastGroup = weightGroups.at(-1);
    if (lastGroup && lastGroup[0].weight.compare(edge.weight) === 0) {
      lastGroup.push(edge);
    } else {
      weightGroups.push([edge]);
    }
  });

  // Each entry is one independent choice point (a connected component of a
  // equal-weight group), holding every spanning tree that component admits
  // The final set of MSTs is the Cartesian product of these choice points
  const choicePoints: Edge[][][] = [];

  for (const group of weightGroups) {
    const pairs: ComponentEdge[] = group
      .map((edge) => ({
        edge,
        a: find(parent, edge.source),
        b: find(parent, edge.target),
      }))
      .filter(({ a, b }) => a !== b);

    if (pairs.length === 0) continue;

    const touchedVertices = new Set<string>();
    pairs.forEach(({ a, b }) => {
      touchedVertices.add(a);
      touchedVertices.add(b);
    });

    const groupParent: Parent = new Map(
      [...touchedVertices].map((vertex) => [vertex, vertex]),
    );
    pairs.forEach(({ a, b }) => union(groupParent, a, b));

    const components = new Map<
      string,
      { vertices: Set<string>; pairs: ComponentEdge[] }
    >();

    touchedVertices.forEach((vertex) => {
      const root = find(groupParent, vertex);
      if (!components.has(root)) {
        components.set(root, { vertices: new Set(), pairs: [] });
      }
      nullThrows(
        components.get(root),
        `component ${root} was just seeded above, so it must be present`,
      ).vertices.add(vertex);
    });

    pairs.forEach((pair) => {
      const root = find(groupParent, pair.a);
      nullThrows(
        components.get(root),
        `component ${root} must exist because every endpoint of a pair is a touched vertex`,
      ).pairs.push(pair);
    });

    components.forEach(({ vertices, pairs: componentPairs }) => {
      const options = allSpanningTrees([...vertices], componentPairs);
      choicePoints.push(options);

      const firstOption = nullThrows(
        options.at(0),
        'every equal-weight component is connected by construction, so it must admit at least one spanning tree',
      );

      // Advance the real union-find with one arbitrary valid choice, so
      // later (strictly higher-weight) groups see the correct components
      firstOption.forEach((edge) => union(parent, edge.source, edge.target));
    });
  }

  let msts: Edge[][] = [[]];
  choicePoints.forEach((options) => {
    const next: Edge[][] = [];
    msts.forEach((combo) => {
      options.forEach((option) => {
        next.push([...combo, ...option]);
      });
    });
    msts = next;
  });

  return {
    msts,
    totalWeight: msts[0].reduce(
      (sum, edge) => sum.add(edge.weight),
      new Fraction(0),
    ),
    // a graph with no nodes has nothing to disconnect, so it counts as connected
    connected: nodes.length === 0 || msts[0].length === nodes.length - 1,
  };
};
