import Fraction from 'fraction.js';
import { describe, expect, it, test } from 'vitest';

import type { Edge, Node } from '../types.ts';
import { bellmanFord } from './index.ts';

const nodes = (...ids: string[]): Node[] => ids.map((id) => ({ id }));

const edge = (
  source: string,
  target: string,
  weight: number | string,
): Edge => ({
  id: source + target,
  source,
  target,
  weight: new Fraction(weight),
});

/*
  a cycle can be reported from any node on it, so the walk is rotated to start
  at whichever node sorts first. that keeps an assertion about which loop was
  found from also asserting where the walk happened to enter it
*/
const cycleOf = (result: ReturnType<typeof bellmanFord>) => {
  if (!result.negativeCycle) throw new Error('expected a negative cycle');

  const { nodes, edges } = result.cycle;
  const start = nodes.indexOf([...nodes].sort()[0]);
  const rotate = <T>(list: T[]) => [
    ...list.slice(start),
    ...list.slice(0, start),
  ];

  return { nodes: rotate(nodes), edges: rotate(edges) };
};

/** infinity reads better than `undefined` in a failure message */
const readable = (result: ReturnType<typeof bellmanFord>) => {
  if (result.negativeCycle) throw new Error('expected distances');
  return Object.fromEntries(
    Object.entries(result.distances).map(([id, distance]) => [
      id,
      distance?.toFraction() ?? '∞',
    ]),
  );
};

describe(bellmanFord, () => {
  it('returns the shortest distance to every reachable node', () => {
    const result = bellmanFord(
      nodes('A', 'B', 'C', 'D'),
      [
        edge('A', 'B', 1),
        edge('B', 'C', 2),
        edge('A', 'C', 7),
        edge('C', 'D', 3),
      ],
      'A',
    );

    // A to C goes through B for 3, rather than taking the direct edge for 7
    expect(readable(result)).toEqual({ A: '0', B: '1', C: '3', D: '6' });
  });

  it('handles negative edge weights', () => {
    const result = bellmanFord(
      nodes('A', 'B', 'C'),
      [edge('A', 'B', 4), edge('A', 'C', 5), edge('C', 'B', -3)],
      'A',
    );

    // the detour through C costs 2, which the direct edge of 4 cannot match.
    // dijkstra would have settled B at 4 before ever looking at C
    expect(readable(result)).toEqual({ A: '0', B: '2', C: '5' });
  });

  it('keeps weights exact rather than drifting into floats', () => {
    const result = bellmanFord(
      nodes('A', 'B', 'C', 'D'),
      [edge('A', 'B', '1/3'), edge('B', 'C', '1/3'), edge('C', 'D', '1/3')],
      'A',
    );

    expect(readable(result)).toEqual({ A: '0', B: '1/3', C: '2/3', D: '1' });
  });

  it('reports a negative cycle instead of returning distances', () => {
    const result = bellmanFord(
      nodes('A', 'B', 'C'),
      [edge('A', 'B', 1), edge('B', 'C', -2), edge('C', 'B', -2)],
      'A',
    );

    expect(result.negativeCycle).toBe(true);
    expect(result).not.toHaveProperty('distances');
  });

  it('returns the cycle it found, not just the edge that proved it', () => {
    const result = bellmanFord(
      nodes('A', 'B', 'C'),
      [edge('A', 'B', 1), edge('B', 'C', -2), edge('C', 'B', -2)],
      'A',
    );

    expect(cycleOf(result)).toEqual({ nodes: ['B', 'C'], edges: ['BC', 'CB'] });
  });

  it('finds the cycle when the witness edge is not part of it', () => {
    /*
      D hangs off the cycle rather than sitting on it, but its distance falls
      every lap B and C take, so CD is still relaxing on the sweep that catches
      the cycle. listing it first is what makes it the edge caught: the sweep
      stops at the first arc that relaxes, and the point of the case is that
      the edge proving a cycle need not be on one
    */
    const result = bellmanFord(
      nodes('A', 'B', 'C', 'D'),
      [
        edge('C', 'D', 5),
        edge('A', 'B', 1),
        edge('B', 'C', -2),
        edge('C', 'B', -2),
      ],
      'A',
    );

    if (!result.negativeCycle) throw new Error('expected a negative cycle');
    expect(result.witnessEdge).toBe('CD');
    expect(cycleOf(result)).toEqual({ nodes: ['B', 'C'], edges: ['BC', 'CB'] });
  });

  it('reports a negative self loop as a cycle of one', () => {
    const result = bellmanFord(nodes('A'), [edge('A', 'A', -1)], 'A');

    expect(cycleOf(result)).toEqual({ nodes: ['A'], edges: ['AA'] });
  });

  it('ignores a negative cycle the source cannot reach', () => {
    const result = bellmanFord(
      nodes('A', 'B', 'C', 'D'),
      [
        edge('A', 'B', 1),
        // C and D loop below zero, but nothing leads into them from A
        edge('C', 'D', -2),
        edge('D', 'C', -2),
      ],
      'A',
    );

    expect(readable(result)).toEqual({ A: '0', B: '1', C: '∞', D: '∞' });
  });

  it('leaves unreachable nodes at infinity', () => {
    const result = bellmanFord(nodes('A', 'B', 'C'), [edge('A', 'B', 1)], 'A');

    expect(readable(result)).toEqual({ A: '0', B: '1', C: '∞' });
  });

  it('treats a source outside the graph as reaching nothing', () => {
    const result = bellmanFord(nodes('A', 'B'), [edge('A', 'B', 1)], 'Z');

    expect(readable(result)).toEqual({ A: '∞', B: '∞' });
  });

  it('settles within one relaxation pass per node less one', () => {
    /*
      the worst ordering there is: a path graph whose edges are listed back to
      front, so a pass carries the distance exactly one hop further and the
      last node is only reached on the fifth of five passes. an implementation
      that stopped short would leave it at infinity
    */
    const result = bellmanFord(
      nodes('A', 'B', 'C', 'D', 'E', 'F'),
      [
        edge('E', 'F', 1),
        edge('D', 'E', 1),
        edge('C', 'D', 1),
        edge('B', 'C', 1),
        edge('A', 'B', 1),
      ],
      'A',
    );

    expect(readable(result)).toEqual({
      A: '0',
      B: '1',
      C: '2',
      D: '3',
      E: '4',
      F: '5',
    });
  });

  it('walks an undirected edge from either end', () => {
    const result = bellmanFord(
      nodes('A', 'B', 'C'),
      [edge('B', 'A', 1), edge('C', 'B', 2)],
      'A',
      { directed: false },
    );

    expect(readable(result)).toEqual({ A: '0', B: '1', C: '3' });
  });

  it('counts an undirected negative edge as a negative cycle', () => {
    // stepping back and forth along it is a lap that gets cheaper every time,
    // so the one edge is ridden twice and shows up in the lap twice
    const result = bellmanFord(nodes('A', 'B'), [edge('A', 'B', -1)], 'A', {
      directed: false,
    });

    expect(cycleOf(result)).toEqual({
      nodes: ['A', 'B'],
      edges: ['AB', 'AB'],
    });
  });

  it('ignores an edge hanging off a node that was not passed in', () => {
    const result = bellmanFord(
      nodes('A', 'B'),
      [edge('A', 'B', 1), edge('B', 'GHOST', 1)],
      'A',
    );

    expect(readable(result)).toEqual({ A: '0', B: '1' });
  });

  it('does not mutate the input graph', () => {
    const inputNodes = nodes('A', 'B', 'C');
    const inputEdges = [edge('A', 'B', 1), edge('B', 'C', 2)];

    // a fraction holds bigints, so the snapshot is taken through toFraction
    // rather than a structured clone
    const snapshot = () => ({
      nodes: inputNodes.map((node) => node.id),
      edges: inputEdges.map((input) => ({
        ...input,
        weight: input.weight.toFraction(),
      })),
    });

    const before = snapshot();
    bellmanFord(inputNodes, inputEdges, 'A');

    expect(snapshot()).toEqual(before);
  });

  // dijkstras is still a stub in path-finding/dijkstras
  test.todo('agrees with dijkstras when every weight is non negative');
});
