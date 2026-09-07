import { describe, expect, it } from 'vitest';

import { graphToTree } from './graphToTree.ts';

/** node id, value */
type NodeSpec = [string, number];
/** parent id, child id */
type EdgeSpec = [string, string];

/*
  graphToTree reads three things off a graph and nothing else: the node list, the
  edge list, and each node's label. building those by hand keeps a tree parsing
  test from needing a canvas to run on
*/
const makeGraph = (nodes: NodeSpec[], edges: EdgeSpec[]): any => {
  const nodeList = nodes.map(([id, value]) => ({ id, label: String(value) }));

  return {
    nodes: { value: nodeList },
    edges: {
      value: edges.map(([source, target]) => ({ source, target })),
    },
    getNode: (id: string) => nodeList.find((node) => node.id === id),
  };
};

describe('graphToTree', () => {
  it('yields no root for an empty graph', () => {
    expect(graphToTree(makeGraph([], []))).toBeUndefined();
  });

  it('reads a lone node as the root', () => {
    const root = graphToTree(makeGraph([['a', 5]], []));

    expect(root).toMatchObject({ id: 'a', value: 5 });
    expect(root?.left).toBeUndefined();
    expect(root?.right).toBeUndefined();
  });

  it('puts a smaller child on the left', () => {
    const root = graphToTree(
      makeGraph(
        [
          ['a', 5],
          ['b', 3],
        ],
        [['a', 'b']],
      ),
    );

    expect(root?.left).toMatchObject({ id: 'b', value: 3 });
    expect(root?.right).toBeUndefined();
  });

  it('puts a larger child on the right', () => {
    const root = graphToTree(
      makeGraph(
        [
          ['a', 5],
          ['b', 8],
        ],
        [['a', 'b']],
      ),
    );

    expect(root?.right).toMatchObject({ id: 'b', value: 8 });
    expect(root?.left).toBeUndefined();
  });

  it('puts a child equal to its parent on the right', () => {
    const root = graphToTree(
      makeGraph(
        [
          ['a', 5],
          ['b', 5],
        ],
        [['a', 'b']],
      ),
    );

    expect(root?.right).toMatchObject({ id: 'b' });
    expect(root?.left).toBeUndefined();
  });

  it('compares labels as numbers rather than as strings', () => {
    // '10' sorts before '9' lexically, so a string comparison would go left here
    const root = graphToTree(
      makeGraph(
        [
          ['a', 9],
          ['b', 10],
        ],
        [['a', 'b']],
      ),
    );

    expect(root?.right).toMatchObject({ id: 'b', value: 10 });
    expect(root?.left).toBeUndefined();
  });

  it('assigns both children of a full node', () => {
    const root = graphToTree(
      makeGraph(
        [
          ['a', 5],
          ['b', 3],
          ['c', 8],
        ],
        [
          ['a', 'b'],
          ['a', 'c'],
        ],
      ),
    );

    expect(root?.left).toMatchObject({ id: 'b', value: 3 });
    expect(root?.right).toMatchObject({ id: 'c', value: 8 });
  });

  it('does not care what order the edges arrive in', () => {
    const root = graphToTree(
      makeGraph(
        [
          ['a', 5],
          ['b', 3],
          ['c', 8],
        ],
        [
          ['a', 'c'],
          ['a', 'b'],
        ],
      ),
    );

    expect(root?.left).toMatchObject({ id: 'b' });
    expect(root?.right).toMatchObject({ id: 'c' });
  });

  it('recurses to arbitrary depth', () => {
    const root = graphToTree(
      makeGraph(
        [
          ['a', 10],
          ['b', 5],
          ['c', 15],
          ['d', 2],
          ['e', 7],
        ],
        [
          ['a', 'b'],
          ['a', 'c'],
          ['b', 'd'],
          ['b', 'e'],
        ],
      ),
    );

    expect(root).toMatchObject({ id: 'a', value: 10 });
    expect(root?.left).toMatchObject({ id: 'b', value: 5 });
    expect(root?.right).toMatchObject({ id: 'c', value: 15 });
    expect(root?.left?.left).toMatchObject({ id: 'd', value: 2 });
    expect(root?.left?.right).toMatchObject({ id: 'e', value: 7 });
  });

  it('follows a chain that only ever leans one way', () => {
    const root = graphToTree(
      makeGraph(
        [
          ['a', 10],
          ['b', 8],
          ['c', 6],
        ],
        [
          ['a', 'b'],
          ['b', 'c'],
        ],
      ),
    );

    expect(root?.left?.left).toMatchObject({ id: 'c', value: 6 });
    expect(root?.right).toBeUndefined();
    expect(root?.left?.right).toBeUndefined();
  });

  it('finds the root wherever it sits in the node list', () => {
    // the parentless node is listed last, so a naive "first node wins" would
    // pick a leaf and drop everything above it
    const root = graphToTree(
      makeGraph(
        [
          ['b', 3],
          ['c', 8],
          ['a', 5],
        ],
        [
          ['a', 'b'],
          ['a', 'c'],
        ],
      ),
    );

    expect(root).toMatchObject({ id: 'a', value: 5 });
    expect(root?.left).toMatchObject({ id: 'b' });
    expect(root?.right).toMatchObject({ id: 'c' });
  });
});
