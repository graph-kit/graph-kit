import Fraction from 'fraction.js';
import { describe, expect, it } from 'vitest';

import { floydWarshall } from './all-pairs/floyd-warshall.ts';
import { type DistanceRow, formatDistance } from './distance.ts';
import { bellmanFord } from './single-source/bellman-ford.ts';
import { dijkstras } from './single-source/dijkstras.ts';

/** source, target, weight. the weight is anything `new Fraction()` takes */
type EdgeSpec = [string, string, number | string];

/*
  the algorithms read two things off a graph and nothing else: the node list and
  the edge list. standing those up by hand keeps a shortest path test from
  needing a canvas to run on
*/
const makeGraph = (nodeIds: string[], edges: EdgeSpec[]): any => ({
  nodes: { value: nodeIds.map((id) => ({ id })) },
  edges: {
    value: edges.map(([source, target, weight], index) => ({
      id: `e${index}`,
      source,
      target,
      weight: new Fraction(weight),
    })),
  },
});

// generic over the frame, so a single source run and an all pairs run each keep
// their own frame type through to the assertions
const collect = <F>(run: (c: { add: (frame: F) => void }) => void) => {
  const frames: F[] = [];
  run({ add: (frame) => frames.push(frame) });
  return frames;
};

const last = <F>(frames: F[]) => frames[frames.length - 1];

/*
  distances are fractions, and two fractions holding the same value are not the
  same object. comparing the rendered form asserts the value and the way the
  reader will see it in one go, and '∞' falls out of it for free
*/
const readDistances = (row: DistanceRow | undefined) =>
  Object.fromEntries(
    Object.entries(row ?? {}).map(([id, distance]) => [
      id,
      formatDistance(distance),
    ]),
  );

// a -1-> b -2-> d, a -4-> c -1-> d, so d is 3 via b and 5 via c
const DIAMOND: EdgeSpec[] = [
  ['a', 'b', 1],
  ['b', 'd', 2],
  ['a', 'c', 4],
  ['c', 'd', 1],
];

describe('dijkstras', () => {
  it('finds shortest distances on a directed diamond', () => {
    const graph = makeGraph(['a', 'b', 'c', 'd'], DIAMOND);
    const frames = collect(dijkstras(graph, 'a'));
    expect(last(frames).type).toBe('end');
    expect(readDistances(last(frames).distances)).toEqual({
      a: '0',
      b: '1',
      c: '4',
      d: '3',
    });
    expect(last(frames).settledNodeIds).toHaveLength(4);
  });

  it('reports nodes nothing leads to', () => {
    const graph = makeGraph(['a', 'b', 'z'], [['a', 'b', 5]]);
    const frames = collect(dijkstras(graph, 'a'));
    const unreachable = frames.find((f) => f.type === 'unreachable');
    expect(unreachable && 'nodes' in unreachable && unreachable.nodes).toEqual([
      'z',
    ]);
    expect(readDistances(last(frames).distances)).toEqual({
      a: '0',
      b: '5',
      z: '∞',
    });
  });

  it('does not walk an edge backwards', () => {
    const graph = makeGraph(
      ['a', 'b', 'c'],
      [
        ['a', 'b', 2],
        ['c', 'b', 3],
      ],
    );
    const frames = collect(dijkstras(graph, 'a'));
    expect(readDistances(last(frames).distances)).toEqual({
      a: '0',
      b: '2',
      c: '∞',
    });
  });

  it('takes the cheaper of two parallel edges', () => {
    const graph = makeGraph(
      ['a', 'b'],
      [
        ['a', 'b', 9],
        ['a', 'b', 2],
      ],
    );
    const frames = collect(dijkstras(graph, 'a'));
    expect(readDistances(last(frames).distances)).toEqual({ a: '0', b: '2' });
  });

  /*
    the frame names the nodes that cannot be finalized yet because the node just
    settled is cheaper than they are. a node tied with it is not one of them: no
    path out of a node costing the same can come back for less
  */
  it('leaves nodes tied with the settled node out of still-tentative', () => {
    // b and c both cost 2, so settling b leaves only d genuinely waiting
    const graph = makeGraph(
      ['a', 'b', 'c', 'd'],
      [
        ['a', 'b', 2],
        ['a', 'c', 2],
        ['a', 'd', 6],
        ['b', 'd', 1],
      ],
    );
    const frames = collect(dijkstras(graph, 'a'));
    const tentative = frames.filter((f) => f.type === 'still-tentative');

    const waitingAfter = (node: string) =>
      tentative
        .filter((f) => 'via' in f && f.via.node === node)
        .flatMap((f) => ('waiting' in f ? f.waiting : []))
        .map((entry) => entry.node);

    // c ties with b at 2, so settling b leaves d as the only node in doubt
    expect(waitingAfter('b')).toEqual(['d']);
    // and the same holds every time the frame is raised, not just that once
    for (const frame of tentative) {
      if (!('waiting' in frame) || !('via' in frame)) continue;
      for (const entry of frame.waiting) {
        expect(entry.distance.gt(frame.via.distance)).toBe(true);
      }
    }
  });

  /*
    the reason distances are fractions and not floats. three thirds are exactly
    one, but in floats they fall a hair short of it, which is enough to make an
    equal length detour look cheaper than the path it ties with
  */
  it('sums thirds to exactly one', () => {
    const graph = makeGraph(
      ['a', 'b', 'c', 'd'],
      [
        ['a', 'b', '1/3'],
        ['b', 'c', '1/3'],
        ['c', 'd', '1/3'],
        ['a', 'd', 1],
      ],
    );
    const distances = last(collect(dijkstras(graph, 'a'))).distances;
    expect(readDistances(distances)).toEqual({
      a: '0',
      b: '1/3',
      c: '2/3',
      d: '1',
    });
    // the direct edge ties rather than losing, so the tie breaker holds
    expect(distances.d!.equals(1)).toBe(true);
  });
});

describe('bellmanFord', () => {
  it('agrees with dijkstra when weights are non negative', () => {
    const graph = makeGraph(['a', 'b', 'c', 'd'], DIAMOND);
    expect(
      readDistances(last(collect(bellmanFord(graph, 'a'))).distances),
    ).toEqual({ a: '0', b: '1', c: '4', d: '3' });
  });

  it('handles a negative edge dijkstra would get wrong', () => {
    // a->b 5, a->c 6, c->b -4, so b is really 2
    const graph = makeGraph(
      ['a', 'b', 'c'],
      [
        ['a', 'b', 5],
        ['a', 'c', 6],
        ['c', 'b', -4],
      ],
    );
    expect(
      readDistances(last(collect(bellmanFord(graph, 'a'))).distances),
    ).toEqual({ a: '0', b: '2', c: '6' });
  });

  it('keeps fractional weights exact across passes', () => {
    const graph = makeGraph(
      ['a', 'b', 'c'],
      [
        ['a', 'b', '1/7'],
        ['b', 'c', '2/7'],
      ],
    );
    expect(
      readDistances(last(collect(bellmanFord(graph, 'a'))).distances),
    ).toEqual({ a: '0', b: '1/7', c: '3/7' });
  });

  it('stops early once a pass changes nothing', () => {
    const graph = makeGraph(['a', 'b', 'c', 'd'], DIAMOND);
    const frames = collect(bellmanFord(graph, 'a'));
    expect(frames.some((f) => f.type === 'pass-settled')).toBe(true);
  });

  it('calls out a negative cycle', () => {
    const graph = makeGraph(
      ['a', 'b', 'c'],
      [
        ['a', 'b', 1],
        ['b', 'c', -2],
        ['c', 'b', -2],
      ],
    );
    const frames = collect(bellmanFord(graph, 'a'));
    expect(frames.some((f) => f.type === 'negative-cycle')).toBe(true);
  });
});

describe('floydWarshall', () => {
  it('fills in every pair', () => {
    const graph = makeGraph(['a', 'b', 'c', 'd'], DIAMOND);
    const matrix = last(collect(floydWarshall(graph))).matrix;
    expect(readDistances(matrix.a)).toEqual({
      a: '0',
      b: '1',
      c: '4',
      d: '3',
    });
    expect(readDistances(matrix.b)).toEqual({
      a: '∞',
      b: '0',
      c: '∞',
      d: '2',
    });
    expect(readDistances(matrix.d)).toEqual({
      a: '∞',
      b: '∞',
      c: '∞',
      d: '0',
    });
  });

  it('agrees with bellman ford from every source', () => {
    const graph = makeGraph(
      ['a', 'b', 'c'],
      [
        ['a', 'b', 5],
        ['a', 'c', 6],
        ['c', 'b', -4],
      ],
    );
    const matrix = last(collect(floydWarshall(graph))).matrix;
    for (const source of ['a', 'b', 'c']) {
      const distances = last(collect(bellmanFord(graph, source))).distances;
      expect(readDistances(matrix[source])).toEqual(readDistances(distances));
    }
  });

  it('routes through a pivot without losing exactness', () => {
    const graph = makeGraph(
      ['a', 'b', 'c'],
      [
        ['a', 'b', '1/3'],
        ['b', 'c', '1/6'],
      ],
    );
    const matrix = last(collect(floydWarshall(graph))).matrix;
    expect(formatDistance(matrix.a.c)).toBe('1/2');
  });

  it('calls out a negative cycle', () => {
    const graph = makeGraph(
      ['a', 'b'],
      [
        ['a', 'b', 1],
        ['b', 'a', -3],
      ],
    );
    const frames = collect(floydWarshall(graph));
    expect(frames.some((f) => f.type === 'negative-cycle')).toBe(true);
  });
});
