import { CoreEdge, CoreNode } from '@graph/primitives/types';
import Fraction from 'fraction.js';
import { describe, expect, it } from 'vitest';

import { getTransitionMatrix } from './index.ts';
import { TransitionMatrix, TransitionMatrixGraph } from './types.ts';

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

const buildGraph = ({
  nodes,
  edges,
  directed = true,
}: GraphSpec): TransitionMatrixGraph => {
  const edgeList: CoreEdge[] = edges.map((edge, index) => ({
    id: edge.id ?? `edge-${index}`,
    source: edge.source,
    target: edge.target,
  }));

  const weightOf = new Map(
    edges.map((edge, index) => [
      edges[index].id ?? `edge-${index}`,
      new Fraction(edge.weight ?? 1),
    ]),
  );

  return {
    metadata: { directed, weighted: true },
    nodes: () => nodes.map((id): CoreNode => ({ id })),
    edges: () => edgeList,
    getEdge: (edgeId) => {
      const edge = edgeList.find(({ id }) => id === edgeId);
      if (!edge) throw new Error(`no edge ${edgeId}`);
      return { ...edge, weight: weightOf.get(edgeId) ?? new Fraction(0) };
    },
  };
};

/** the matrix as plain numbers, so a whole expected grid reads at a glance */
const toNumbers = (matrix: TransitionMatrix) =>
  matrix.map((row) => row.map((weight) => weight.valueOf()));

describe(getTransitionMatrix, () => {
  it('is empty for a graph with no nodes', () => {
    const matrix = getTransitionMatrix(buildGraph({ nodes: [], edges: [] }));
    expect(matrix).toEqual([]);
  });

  it('is all zeroes for nodes with no edges', () => {
    const matrix = getTransitionMatrix(
      buildGraph({ nodes: ['a', 'b'], edges: [] }),
    );

    expect(toNumbers(matrix)).toEqual([
      [0, 0],
      [0, 0],
    ]);
  });

  it('is square in the number of nodes, not the number of edges', () => {
    const matrix = getTransitionMatrix(
      buildGraph({
        nodes: ['a', 'b', 'c'],
        edges: [
          { source: 'a', target: 'b' },
          { source: 'b', target: 'c' },
          { source: 'c', target: 'a' },
          { source: 'a', target: 'c' },
        ],
      }),
    );

    expect(matrix).toHaveLength(3);
    for (const row of matrix) expect(row).toHaveLength(3);
  });

  it('writes a directed edge in one direction only', () => {
    const matrix = getTransitionMatrix(
      buildGraph({
        nodes: ['a', 'b'],
        edges: [{ source: 'a', target: 'b', weight: 5 }],
      }),
    );

    expect(toNumbers(matrix)).toEqual([
      [0, 5],
      [0, 0],
    ]);
  });

  it('writes an undirected edge in both directions', () => {
    const matrix = getTransitionMatrix(
      buildGraph({
        nodes: ['a', 'b'],
        edges: [{ source: 'a', target: 'b', weight: 5 }],
        directed: false,
      }),
    );

    expect(toNumbers(matrix)).toEqual([
      [0, 5],
      [5, 0],
    ]);
  });

  it('puts a self loop on the diagonal', () => {
    const matrix = getTransitionMatrix(
      buildGraph({
        nodes: ['a', 'b'],
        edges: [{ source: 'b', target: 'b', weight: 3 }],
      }),
    );

    expect(toNumbers(matrix)).toEqual([
      [0, 0],
      [0, 3],
    ]);
  });

  it('indexes rows and columns by position in the node list', () => {
    const nodes = ['x', 'y', 'z'];
    const matrix = getTransitionMatrix(
      buildGraph({
        nodes,
        edges: [{ source: 'z', target: 'x', weight: 7 }],
      }),
    );

    expect(toNumbers(matrix)[nodes.indexOf('z')][nodes.indexOf('x')]).toBe(7);
  });

  it('follows a reordered node list rather than a fixed ordering', () => {
    const edges = [{ source: 'a', target: 'b', weight: 4 }];

    const forward = toNumbers(
      getTransitionMatrix(buildGraph({ nodes: ['a', 'b'], edges })),
    );
    const reversed = toNumbers(
      getTransitionMatrix(buildGraph({ nodes: ['b', 'a'], edges })),
    );

    expect(forward).toEqual([
      [0, 4],
      [0, 0],
    ]);
    expect(reversed).toEqual([
      [0, 0],
      [4, 0],
    ]);
  });

  it('keeps the last of several edges between the same pair', () => {
    const matrix = getTransitionMatrix(
      buildGraph({
        nodes: ['a', 'b'],
        edges: [
          { source: 'a', target: 'b', weight: 1 },
          { source: 'a', target: 'b', weight: 9 },
        ],
      }),
    );

    expect(toNumbers(matrix)[0][1]).toBe(9);
  });

  describe('an edge pointing at a node that is not in the node list', () => {
    const danglingTarget: GraphSpec = {
      nodes: ['a', 'b'],
      edges: [
        { source: 'a', target: 'b', weight: 2 },
        { source: 'a', target: 'ghost', weight: 8 },
      ],
    };

    it('does not throw', () => {
      expect(() =>
        getTransitionMatrix(buildGraph(danglingTarget)),
      ).not.toThrow();
    });

    it('is skipped without disturbing the rest of the matrix', () => {
      const matrix = getTransitionMatrix(buildGraph(danglingTarget));

      expect(toNumbers(matrix)).toEqual([
        [0, 2],
        [0, 0],
      ]);
    });

    it('is skipped when it is the source that is missing', () => {
      const matrix = getTransitionMatrix(
        buildGraph({
          nodes: ['a', 'b'],
          edges: [{ source: 'ghost', target: 'b', weight: 8 }],
        }),
      );

      expect(toNumbers(matrix)).toEqual([
        [0, 0],
        [0, 0],
      ]);
    });

    it('leaves no out of range row behind', () => {
      const matrix = getTransitionMatrix(buildGraph(danglingTarget));

      // a bad index writes a property rather than throwing, so length is the tell
      expect(matrix).toHaveLength(2);
      expect(Object.keys(matrix[0])).toEqual(['0', '1']);
    });
  });
});
