import Fraction from 'fraction.js';
import { describe, expect, it } from 'vitest';

import { floydWarshall } from './all-pairs/floyd-warshall.ts';
import { routeBetween } from './all-pairs/routeTrail.ts';
import { type DistanceRow, formatDistance } from './distance.ts';
import { bellmanFord } from './single-source/bellman-ford.ts';
import { dijkstras } from './single-source/dijkstras.ts';
import { singleSourceExplainer } from './single-source/explainer.ts';
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
    the explainer only needs the two lookups below on top of a bare graph, and
    a themer it can build a highlight from without a canvas to paint on
  */
  const explainerFor = (graph: any) =>
    singleSourceExplainer({
      ...graph,
      getEdge: (id: string) =>
        graph.edges.value.find((edge: any) => edge.id === id),
      theme: { createThemer: () => ({ activate() {}, deactivate() {} }) },
      focus: { theme: { _resolveToken: () => '#000000' } },
    } as any);

  it('says why an offer that doubles back is not a cost worth comparing', () => {
    const graph = makeGraph(
      ['a', 'b', 'c'],
      [
        ['a', 'b', 1],
        ['b', 'c', 1],
        ['c', 'b', 5],
      ],
    );
    const explain = explainerFor(graph);
    const keeps = collect(bellmanFord(graph, 'a')).filter(
      (frame) => frame.type === 'keep-distance',
    );

    const doublingBack = keeps.find((frame) => frame.edge === 'e2');
    expect(doublingBack && explain(doublingBack)?.content).toBe(
      'Following {e2} would visit {b} twice, adding cost for no progress. The current cost [Remains]',
    );

    /*
      the sentence for a real comparison is left alone, with both costs still
      bracketed so both routes stay hoverable
    */
    const genuine = keeps.find((frame) => frame.edge === 'e0');
    expect(genuine && explain(genuine)?.content).toBe(
      '[1] does not decrease the cost of reaching {b} which currently costs [1]. Therefore the current cost [Remains]',
    );
  });

  /*
    an edge can land back on a node the route has already reached, and the walk
    that makes is not a trip anyone would take unless the lap it closes costs
    less than nothing. it needs no negative weights at all to come up
  */
  it('offers no route when an edge only doubles back into the route', () => {
    // a -e0-> b -e1-> c, and c -e2-> b lands back on b, closing a lap of 6
    const graph = makeGraph(
      ['a', 'b', 'c'],
      [
        ['a', 'b', 1],
        ['b', 'c', 1],
        ['c', 'b', 5],
      ],
    );
    const keeps = collect(bellmanFord(graph, 'a')).filter(
      (frame) => frame.type === 'keep-distance',
    );

    const doublingBack = keeps.filter((frame) => frame.edge === 'e2');
    expect(doublingBack.length).toBeGreaterThan(0);
    for (const frame of doublingBack) expect(frame.offeredPath).toEqual([]);

    // an offer that really is a trip still carries the route it is paid on
    expect(keeps.find((frame) => frame.edge === 'e0')?.offeredPath).toEqual([
      'e0',
    ]);
  });

  /*
    a -e0-> x -e1-> b reaches the cycle b -e2-> c -e3-> b, which costs less
    every lap. once the cycle overwrites the edge b was first reached by, the
    arrival chain can only go round the loop, so the way in has to be kept as
    the route is paid rather than read back off it afterwards
  */
  const REACHES_A_CYCLE = makeGraph(
    ['a', 'x', 'b', 'c'],
    [
      ['a', 'x', 1],
      ['x', 'b', 1],
      ['b', 'c', -2],
      ['c', 'b', -2],
    ],
  );

  const routesShownIn = (frames: SingleSourceFrame[]) =>
    frames.flatMap((frame) => [
      ...('basePath' in frame ? [frame.basePath] : []),
      ...('newPath' in frame ? [frame.newPath] : []),
      ...('offeredPath' in frame ? [frame.offeredPath] : []),
      ...('currentPath' in frame ? [frame.currentPath] : []),
      ...('oldPath' in frame ? [frame.oldPath] : []),
    ]);

  it('keeps the edges leading in from the start on a route that laps a cycle', () => {
    const frames = collect(bellmanFord(REACHES_A_CYCLE, 'a'));

    const startsElsewhere = routesShownIn(frames).filter(
      (route) =>
        route.length > 0 &&
        REACHES_A_CYCLE.edges.value.find((edge: any) => edge.id === route[0])
          .source !== 'a',
    );
    expect(startsElsewhere).toEqual([]);

    // the route to b, once the cycle has been lapped, still shows the way in
    const lapped = frames.find(
      (frame) =>
        frame.type === 'keep-distance' &&
        frame.node === 'b' &&
        frame.currentPath.length > 2,
    );
    expect(lapped && 'currentPath' in lapped && lapped.currentPath).toEqual([
      'e0',
      'e1',
      'e2',
      'e3',
    ]);
  });

  it('shows a route whose weight is the distance it is shown against', () => {
    const weightOf = (edgeIds: readonly string[]) =>
      edgeIds.reduce(
        (total, id) =>
          total.add(
            REACHES_A_CYCLE.edges.value.find((edge: any) => edge.id === id)
              .weight,
          ),
        new Fraction(0),
      );

    for (const frame of collect(bellmanFord(REACHES_A_CYCLE, 'a'))) {
      if (frame.type !== 'improve-distance') continue;
      expect(weightOf(frame.newPath).toFraction()).toBe(
        frame.newDistance.toFraction(),
      );
    }
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

  /*
    a cell holds one number, but the reader is looking at a graph. the route it
    was spliced from is what puts that number back on the canvas
  */
  it('rebuilds the route a cell was spliced from', () => {
    const graph = makeGraph(['a', 'b', 'c', 'd'], DIAMOND);
    const frames = collect(floydWarshall(graph));

    const improved = frames.filter(
      (f) => f.type === 'improve-pair' && f.from === 'a' && f.to === 'd',
    );

    // a -e0-> b -e1-> d, the 3 the table settles on, rather than the 5 via c
    expect(improved.at(-1)).toMatchObject({ detourRoute: ['e0', 'e1'] });
  });

  it('holds on to the route being beaten, so both sides of the swap can be shown', () => {
    // the direct a->c of 9 loses to a->b->c of 3, and both routes are named
    const graph = makeGraph(
      ['a', 'b', 'c'],
      [
        ['a', 'c', 9],
        ['a', 'b', 1],
        ['b', 'c', 2],
      ],
    );
    const frames = collect(floydWarshall(graph));

    const swap = frames.find(
      (f) => f.type === 'improve-pair' && f.from === 'a' && f.to === 'c',
    );

    expect(swap).toMatchObject({
      previousRoute: ['e0'],
      detourRoute: ['e1', 'e2'],
    });
  });

  it('traces the loop behind a negative cycle, and what a lap of it costs', () => {
    const graph = makeGraph(
      ['a', 'b', 'c'],
      [
        ['a', 'b', 1],
        ['b', 'c', -2],
        ['c', 'b', -2],
      ],
    );
    const frames = collect(floydWarshall(graph));

    const cycle = frames.find((f) => f.type === 'negative-cycle');

    // c -e2-> b -e1-> c, which is -4 a lap. the a->b edge is not on it
    expect(cycle).toMatchObject({ node: 'c', cycleEdgeIds: ['e2', 'e1'] });
    expect(cycle && 'loop' in cycle && cycle.loop?.lapCost.toFraction()).toBe(
      '-4',
    );
  });

  /*
    the diagonal going negative is the whole proof, so every pivot after it
    would be filling in a table no answer survives
  */
  it('stops at the proof rather than working through the pivots left', () => {
    const graph = makeGraph(
      ['a', 'b', 'c'],
      [
        ['a', 'b', 1],
        ['b', 'c', -2],
        ['c', 'b', -2],
      ],
    );
    const frames = collect(floydWarshall(graph));

    expect(frames.at(-2)?.type).toBe('negative-cycle');
    expect(last(frames).type).toBe('end');

    const pivots = frames.filter((f) => f.type === 'choose-pivot');
    // the third pivot is never reached, though the run was going to make three
    expect(pivots).toHaveLength(2);
    expect(pivots.at(0)).toMatchObject({ totalPivots: 3 });
  });

  /*
    the table is not an answer once a lap can undercut it, so the run has to
    stop saying it is one
  */
  it('does not close on a finished table when a negative cycle turns up', () => {
    const graph = makeGraph(
      ['a', 'b'],
      [
        ['a', 'b', 1],
        ['b', 'a', -3],
      ],
    );
    const frames = collect(floydWarshall(graph));

    const closing = last(frames);
    expect(closing.type).toBe('end');
    expect(closing.cycleEdgeIds).toEqual(['e1', 'e0']);
    // counting unreached pairs off a meaningless table would only mislead
    expect(frames.some((f) => f.type === 'unreachable')).toBe(false);
  });

  /*
    the panel lets the reader ask about any cell, not just the one being worked
    on, so every frame has to carry enough trail to answer for the whole table
    as it stood at that moment
  */
  it('carries a trail that rebuilds any cell of the table it was taken with', () => {
    const graph = makeGraph(['a', 'b', 'c', 'd'], DIAMOND);
    const closing = last(collect(floydWarshall(graph)));

    expect(routeBetween(graph, closing.routes, 'a', 'd')).toEqual(['e0', 'e1']);
    expect(routeBetween(graph, closing.routes, 'a', 'b')).toEqual(['e0']);
    // nothing leads back to a, so no trail does either
    expect(routeBetween(graph, closing.routes, 'd', 'a')).toEqual([]);
  });

  /*
    a cell is written out of two other cells, and those two go on getting
    cheaper without it. rebuilding the cell's route out of them afterwards lands
    on a trip that costs less than the number the cell is showing, and often on
    the very detour the cell is being weighed against, so both sides of the
    comparison light up the same edges
  */
  it('holds each cell to the route it was written with, not a cheaper one since', () => {
    // a to c is spliced to a -> b -> c of 5 on pivot b. pivot d then cuts a to b
    // down to a -> d -> b of 3, which leaves a -> d -> b -> c costing 4
    const graph = makeGraph(
      ['a', 'b', 'c', 'd'],
      [
        ['a', 'b', 4],
        ['a', 'd', 1],
        ['b', 'c', 1],
        ['d', 'b', 2],
      ],
    );
    const frames = collect(floydWarshall(graph));

    const weighed = frames.find(
      (f) =>
        f.type === 'consider-pair' &&
        f.pivot === 'd' &&
        f.from === 'a' &&
        f.to === 'c',
    );

    expect(weighed).toBeDefined();
    if (weighed?.type !== 'consider-pair') throw new Error('never');

    expect(formatDistance(weighed.currentDistance)).toBe('5');
    expect(weighed.currentRoute).toEqual(['e0', 'e2']);
    expect(formatDistance(weighed.detourDistance)).toBe('4');
    expect(weighed.detourRoute).toEqual(['e1', 'e3', 'e2']);
  });

  it('snapshots the trail per frame, rather than sharing the finished one', () => {
    const graph = makeGraph(['a', 'b', 'c', 'd'], DIAMOND);
    const frames = collect(floydWarshall(graph));

    const seeded = frames[0];
    // a to d is only spliced once a pivot gets to it, so the seeding frame has
    // the direct edges and nothing more
    expect(routeBetween(graph, seeded.routes, 'a', 'd')).toEqual([]);
    expect(routeBetween(graph, seeded.routes, 'a', 'b')).toEqual(['e0']);

    expect(routeBetween(graph, last(frames).routes, 'a', 'd')).toEqual([
      'e0',
      'e1',
    ]);
  });

  /*
    the two legs of a detour can overlap, leaving a walk that arrives, wanders
    off and comes back. no one can take that trip, so the pair is passed over
    rather than shown losing to it
  */
  it('passes over a detour that doubles back through a node it has visited', () => {
    // a to e runs a -> c -> d -> e, and e back to d runs e -> b -> d, so the
    // detour from a to d through e would be a -> c -> d -> e -> b -> d
    const graph = makeGraph(
      ['a', 'b', 'c', 'd', 'e'],
      [
        ['a', 'c', 1],
        ['c', 'd', 1],
        ['d', 'e', 1],
        ['e', 'b', 1],
        ['b', 'd', 1],
      ],
    );
    const frames = collect(floydWarshall(graph));

    const weighed = frames.filter(
      (f) => 'pivot' in f && f.pivot === 'e' && f.from === 'a' && f.to === 'd',
    );
    expect(weighed).toEqual([]);

    // and the cell keeps the real route, a -> c -> d
    expect(formatDistance(last(frames).matrix.a.d)).toBe('2');
    expect(routeBetween(graph, last(frames).routes, 'a', 'd')).toEqual([
      'e0',
      'e1',
    ]);
  });

  it('counts the pairs nothing links, against every pair there is', () => {
    const graph = makeGraph(['a', 'b', 'c', 'd'], DIAMOND);
    const unreachable = collect(floydWarshall(graph)).find(
      (f) => f.type === 'unreachable',
    );

    // only a reaches everything: b and c reach d alone, and d reaches nothing
    expect(unreachable).toMatchObject({ pairs: 7, totalPairs: 12 });
  });
});
