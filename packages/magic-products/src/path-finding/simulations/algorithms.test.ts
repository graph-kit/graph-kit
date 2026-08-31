import Fraction from 'fraction.js';
import { describe, expect, it } from 'vitest';

import { floydWarshall } from './all-pairs/floyd-warshall.ts';
import { type DistanceRow, formatDistance } from './distance.ts';
import { bellmanFord } from './single-source/bellman-ford.ts';
import { dijkstras } from './single-source/dijkstras.ts';
import { SingleSourceFrame } from './single-source/frame.ts';

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
    const cycle = frames.find((f) => f.type === 'negative-cycle');
    expect(cycle).toBeDefined();
    // the edge that still improves is the proof, so the frame carries it
    expect(cycle && 'edge' in cycle && cycle.edge).toBeDefined();
    expect(frames.some((f) => f.type === 'no-negative-cycle')).toBe(false);
  });

  /*
    the edges are listed in the reverse of the order the distances travel, which
    is the worst case: every pass carries the wave exactly one edge further, so
    the last pass still improves and the run cannot stop early
  */
  const REVERSE_CHAIN: EdgeSpec[] = [
    ['c', 'd', 1],
    ['b', 'c', 1],
    ['a', 'b', 1],
  ];

  const CHAIN_NODES = ['a', 'b', 'c', 'd'];

  /*
    the frames of each pass, from the frame announcing one to the last frame of
    its sweep. a pass ends where its sweep does, so the verification sweep and
    the frames closing the run stay out of the pass they follow
  */
  const passes = (frames: SingleSourceFrame[]) => {
    const grouped: SingleSourceFrame[][] = [];
    let current: SingleSourceFrame[] | undefined;

    for (const frame of frames) {
      if (frame.type === 'begin-pass') {
        current = [];
        grouped.push(current);
      } else if (
        frame.type === 'begin-verification' ||
        frame.sweep === undefined
      ) {
        current = undefined;
      }
      current?.push(frame);
    }

    return grouped;
  };

  it('sweeps every edge every pass, unreachable sources included', () => {
    // nothing reaches x, so x->y is swept and passed over on every pass
    const graph = makeGraph(
      ['a', 'b', 'x', 'y'],
      [
        ['a', 'b', 1],
        ['x', 'y', 1],
      ],
    );
    const frames = collect(bellmanFord(graph, 'a'));

    const skipped = frames.filter((f) => f.type === 'skip-unreachable');
    expect(skipped.length).toBeGreaterThan(0);
    expect(skipped.every((f) => 'edge' in f && f.edge === 'e1')).toBe(true);

    // every pass accounts for every edge, whether it could be followed or not
    for (const pass of passes(frames)) {
      const touched = pass
        .filter((f) => f.type === 'relax-edge' || f.type === 'skip-unreachable')
        .map((f) => ('edge' in f ? f.edge : undefined));
      expect(touched).toEqual(['e0', 'e1']);
    }
  });

  it('carries the sweep order and a cursor that walks it', () => {
    const graph = makeGraph(CHAIN_NODES, REVERSE_CHAIN);
    const frames = collect(bellmanFord(graph, 'a'));
    const sweepOrder = ['e0', 'e1', 'e2'];

    for (const pass of passes(frames)) {
      // the pass opens on the whole list with nothing visited yet
      expect(pass[0].sweep?.edgeIds).toEqual(sweepOrder);
      expect(pass[0].sweep?.position).toBe(0);

      // and the cursor only ever moves forward, one edge at a time
      const cursor = pass.map((f) => f.sweep?.position);
      expect(cursor).toEqual([...cursor].sort((a, b) => a! - b!));
      expect(Math.max(...cursor.map((at) => at ?? 0))).toBe(sweepOrder.length);
    }
  });

  it('titles each sweep by its pass, and the extra one by neither', () => {
    const graph = makeGraph(CHAIN_NODES, REVERSE_CHAIN);
    const frames = collect(bellmanFord(graph, 'a'));

    // the passes are numbered against the same total the bound is argued from
    expect(passes(frames).map((pass) => pass[0].sweep?.pass)).toEqual([
      1, 2, 3,
    ]);
    for (const pass of passes(frames)) {
      expect(pass[0].sweep?.totalPasses).toBe(3);
    }

    // the extra sweep is not one of them, so it carries no pass to be called by
    const check = frames.find((f) => f.type === 'begin-verification');
    expect(check?.sweep).toBeDefined();
    expect(check?.sweep?.pass).toBeUndefined();
  });

  it('books what every edge did as the sweep rules on it', () => {
    // a->b improves on the first pass, a->c never beats the 1 it already has,
    // and x->y is never crossable because nothing reaches x
    const graph = makeGraph(
      ['a', 'b', 'x', 'y'],
      [
        ['a', 'b', 1],
        ['a', 'b', 4],
        ['x', 'y', 1],
      ],
    );
    const frames = collect(bellmanFord(graph, 'a'));
    const firstPass = passes(frames)[0];

    // nothing is booked before the sweep has ruled, so the opening frame is bare
    expect(firstPass[0].sweep?.outcomes).toEqual({});

    expect(last(firstPass).sweep?.outcomes).toEqual({
      e0: 'improved',
      e1: 'kept',
      e2: 'skipped',
    });
  });

  it('starts each pass with a clean slate of outcomes', () => {
    const graph = makeGraph(CHAIN_NODES, REVERSE_CHAIN);
    const frames = collect(bellmanFord(graph, 'a'));

    /*
      the panel shows what this pass found, not what every pass ever found, so a
      verdict cannot survive into the sweep after it. the reverse chain improves
      exactly one edge per pass, which is what makes that visible at all
      */
    const improvedPerPass = passes(frames).map(
      (pass) =>
        Object.values(last(pass).sweep?.outcomes ?? {}).filter(
          (outcome) => outcome === 'improved',
        ).length,
    );
    expect(improvedPerPass).toEqual([1, 1, 1]);
  });

  it('leaves the sweep off dijkstra, which has no edge list to walk', () => {
    const graph = makeGraph(['a', 'b', 'c', 'd'], DIAMOND);
    const frames = collect(dijkstras(graph, 'a'));
    expect(frames.every((f) => f.sweep === undefined)).toBe(true);
  });

  it('sweeps once more to prove no cycle when the last pass still improved', () => {
    const graph = makeGraph(CHAIN_NODES, REVERSE_CHAIN);
    const frames = collect(bellmanFord(graph, 'a'));

    expect(frames.some((f) => f.type === 'pass-settled')).toBe(false);

    const verification = frames.find((f) => f.type === 'begin-verification');
    expect(
      verification && 'passesDone' in verification && verification.passesDone,
    ).toBe(3);

    // every edge is checked, and every check clears
    expect(frames.filter((f) => f.type === 'verify-edge')).toHaveLength(3);
    expect(frames.some((f) => f.type === 'no-negative-cycle')).toBe(true);
  });

  /*
    a pass that changes nothing is already a proof: no edge can improve, so no
    cycle can be getting cheaper, and the extra sweep would be asking a question
    that has been answered
  */
  it('skips the extra sweep when a pass already changed nothing', () => {
    const graph = makeGraph(['a', 'b', 'c', 'd'], DIAMOND);
    const frames = collect(bellmanFord(graph, 'a'));

    expect(frames.some((f) => f.type === 'pass-settled')).toBe(true);
    expect(frames.some((f) => f.type === 'begin-verification')).toBe(false);
    expect(frames.some((f) => f.type === 'verify-edge')).toBe(false);
  });

  it('finalizes everything reached, all at once, on the last frame', () => {
    const graph = makeGraph(CHAIN_NODES, REVERSE_CHAIN);
    const frames = collect(bellmanFord(graph, 'a'));

    // nothing is final before the end: bellman ford has no settled set to grow
    for (const frame of frames.slice(0, -1)) {
      expect(frame.settledNodeIds).toBeUndefined();
    }
    expect(last(frames).settledNodeIds).toEqual(CHAIN_NODES);
  });

  it('finalizes nothing on a run that ends in a cycle', () => {
    const graph = makeGraph(
      ['a', 'b', 'c'],
      [
        ['a', 'b', 1],
        ['b', 'c', -2],
        ['c', 'b', -2],
      ],
    );
    const frames = collect(bellmanFord(graph, 'a'));

    // nothing is finalized, since no shortest path exists to finalize
    expect(last(frames).settledNodeIds).toBeUndefined();
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
