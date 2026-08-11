import { CoreEdge, CoreNode } from '@graph/primitives/types';
import Fraction from 'fraction.js';
import { describe, expect, it } from 'vitest';

import { getAdjacencyList, getWeightedAdjacencyList } from './index.ts';
import { Graph, WeightedAdjacencyList } from './types.ts';

type EdgeSpec = {
  id?: string;
  source: string;
  target: string;
  weight?: number;
};

type GraphSpec = {
  nodes: string[];
  edges: EdgeSpec[];
  directed?: boolean;
};

const buildGraph = ({ nodes, edges, directed = true }: GraphSpec): Graph => {
  const edgeList: CoreEdge[] = edges.map((edge, index) => ({
    id: edge.id ?? `edge-${index}`,
    source: edge.source,
    target: edge.target,
  }));

  const weightOf = new Map(
    edges.map((edge, index) => [
      edge.id ?? `edge-${index}`,
      new Fraction(edge.weight ?? 1),
    ]),
  );

  return {
    metadata: { directed, weighted: true },
    nodes: () => nodes.map((id): CoreNode => ({ id })),
    edges: () => edgeList,
    getNode: (nodeId) => {
      if (!nodes.includes(nodeId)) throw new Error(`no node ${nodeId}`);
      return { id: nodeId };
    },
    getEdge: (edgeId) => {
      const edge = edgeList.find(({ id }) => id === edgeId);
      if (!edge) throw new Error(`no edge ${edgeId}`);
      return { ...edge, weight: weightOf.get(edgeId) ?? new Fraction(0) };
    },
    events: {} as Graph['events'],
  };
};

/** neighbor ids paired with their weights, so a whole list reads at a glance */
const summarize = (adjList: WeightedAdjacencyList) =>
  Object.fromEntries(
    Object.entries(adjList).map(([nodeId, neighbors]) => [
      nodeId,
      neighbors.map(({ id, weight }) => [id, weight.valueOf()]),
    ]),
  );

describe(getWeightedAdjacencyList, () => {
  it('gives every node a key, including ones with no edges', () => {
    const adjList = getWeightedAdjacencyList(
      buildGraph({ nodes: ['a', 'b'], edges: [] }),
    );

    expect(summarize(adjList)).toEqual({ a: [], b: [] });
  });

  it('records a directed edge on the source only', () => {
    const adjList = getWeightedAdjacencyList(
      buildGraph({
        nodes: ['a', 'b'],
        edges: [{ source: 'a', target: 'b', weight: 5 }],
      }),
    );

    expect(summarize(adjList)).toEqual({ a: [['b', 5]], b: [] });
  });

  it('records an undirected edge on both endpoints', () => {
    const adjList = getWeightedAdjacencyList(
      buildGraph({
        nodes: ['a', 'b'],
        edges: [{ source: 'a', target: 'b', weight: 5 }],
        directed: false,
      }),
    );

    expect(summarize(adjList)).toEqual({ a: [['b', 5]], b: [['a', 5]] });
  });

  it('records an undirected self loop once', () => {
    const adjList = getWeightedAdjacencyList(
      buildGraph({
        nodes: ['a'],
        edges: [{ source: 'a', target: 'a', weight: 3 }],
        directed: false,
      }),
    );

    expect(summarize(adjList)).toEqual({ a: [['a', 3]] });
  });

  it('gives each parallel edge its own weight', () => {
    const adjList = getWeightedAdjacencyList(
      buildGraph({
        nodes: ['a', 'b'],
        edges: [
          { source: 'a', target: 'b', weight: 1 },
          { source: 'a', target: 'b', weight: 9 },
        ],
      }),
    );

    expect(summarize(adjList)).toEqual({
      a: [
        ['b', 1],
        ['b', 9],
      ],
      b: [],
    });
  });

  it('skips an edge whose endpoint is not in the node list', () => {
    const graph = buildGraph({
      nodes: ['a', 'b'],
      edges: [
        { source: 'a', target: 'b', weight: 2 },
        { source: 'a', target: 'ghost', weight: 8 },
        { source: 'ghost', target: 'b', weight: 8 },
      ],
    });

    expect(() => getWeightedAdjacencyList(graph)).not.toThrow();
    expect(summarize(getWeightedAdjacencyList(graph))).toEqual({
      a: [['b', 2]],
      b: [],
    });
  });

  it('agrees with the unweighted list on who the neighbors are', () => {
    const spec: GraphSpec = {
      nodes: ['a', 'b', 'c'],
      edges: [
        { source: 'a', target: 'b' },
        { source: 'b', target: 'c' },
        { source: 'a', target: 'c' },
      ],
    };

    for (const directed of [true, false]) {
      const graph = buildGraph({ ...spec, directed });

      const weighted = Object.fromEntries(
        Object.entries(getWeightedAdjacencyList(graph)).map(
          ([nodeId, neighbors]) => [nodeId, neighbors.map(({ id }) => id)],
        ),
      );

      expect(weighted).toEqual(getAdjacencyList(graph));
    }
  });
});
