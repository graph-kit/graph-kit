import Fraction from 'fraction.js';
import { describe, expect, it } from 'vitest';

import { kruskals } from './kruskals.ts';

/** source, target, weight. the weight is anything `new Fraction()` takes */
type EdgeSpec = [string, string, number | string];

/*
  kruskals only reads two things off a graph: the node list and the edge list
  (already carrying its weight, the way `graph.edges.value` really does).
  standing those up by hand keeps this from needing a canvas to run on,
  mirroring prims.test.ts
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

const collect = <F>(run: (c: { add: (frame: F) => void }) => void) => {
  const frames: F[] = [];
  run({ add: (frame) => frames.push(frame) });
  return frames;
};

const last = <F>(frames: F[]) => frames[frames.length - 1];

describe('kruskals', () => {
  it('grows a minimum spanning tree without needing a start node', () => {
    // triangle: a-b 1, b-c 2, a-c 9 -> cheapest tree is a-b, b-c
    const graph = makeGraph(
      ['a', 'b', 'c'],
      [
        ['a', 'b', 1],
        ['b', 'c', 2],
        ['a', 'c', 9],
      ],
    );
    const frames = collect(kruskals(graph));
    expect(last(frames).type).toBe('end');
    expect([...last(frames).treeEdgeIds].sort()).toEqual(['e0', 'e1']);
    expect([...last(frames).treeNodeIds].sort()).toEqual(['a', 'b', 'c']);
  });

  it('takes the cheaper of two parallel edges', () => {
    const graph = makeGraph(
      ['a', 'b'],
      [
        ['a', 'b', 9],
        ['a', 'b', 2],
      ],
    );
    const frames = collect(kruskals(graph));
    expect(last(frames).treeEdgeIds).toEqual(['e1']);
  });

  it('rejects an edge that would close a loop', () => {
    // a-b (1) and b-c (1) join the tree; a-c (2) would only close a cycle
    // between them. c-d (3) is what actually completes the spanning tree, so
    // a-c gets a verdict before the algorithm has any reason to stop early
    const graph = makeGraph(
      ['a', 'b', 'c', 'd'],
      [
        ['a', 'b', 1],
        ['b', 'c', 1],
        ['a', 'c', 2],
        ['c', 'd', 3],
      ],
    );
    const frames = collect(kruskals(graph));

    const rejected = frames.find((f) => f.type === 'reject-edge');
    expect(rejected && 'edge' in rejected ? rejected.edge : undefined).toBe(
      'e2',
    );
    expect(last(frames).excludedEdgeIds).toEqual(['e2']);
    expect([...last(frames).treeEdgeIds].sort()).toEqual(['e0', 'e1', 'e3']);
  });

  it('reports nodes the tree never reaches', () => {
    const graph = makeGraph(['a', 'b', 'z'], [['a', 'b', 5]]);
    const frames = collect(kruskals(graph));
    const unreachable = frames.find((f) => f.type === 'unreachable');
    expect(unreachable && 'nodes' in unreachable && unreachable.nodes).toEqual(
      ['z'],
    );
    expect([...last(frames).treeNodeIds].sort()).toEqual(['a', 'b']);
  });

  it('does not treat a single isolated node as disconnected', () => {
    const graph = makeGraph(['a'], []);
    const frames = collect(kruskals(graph));
    expect(frames.some((f) => f.type === 'unreachable')).toBe(false);
    expect(last(frames).type).toBe('end');
  });

  it('considers every edge exactly once, in ascending weight order', () => {
    const graph = makeGraph(
      ['a', 'b', 'c', 'd'],
      [
        ['a', 'b', 5],
        ['a', 'c', 1],
        ['a', 'd', 4],
      ],
    );
    const frames = collect(kruskals(graph));
    const considered = frames
      .filter((f): f is typeof f & { edge: string } => f.type === 'consider-edge')
      .map((f) => f.edge);
    expect(considered).toEqual(['e1', 'e2', 'e0']);
  });

  it('breaks ties arbitrarily rather than always favoring the earliest edge', () => {
    // a star of five equally-cheap spokes: every run has a 1-in-5 chance of
    // picking e0 first if ties are broken fairly. running it a few dozen
    // times should see more than one edge accepted first - a flaky-looking
    // test here is actually the point, since it proves the tie-break isn't
    // deterministic
    const graph = makeGraph(
      ['hub', 'a', 'b', 'c', 'd', 'e'],
      [
        ['hub', 'a', 1],
        ['hub', 'b', 1],
        ['hub', 'c', 1],
        ['hub', 'd', 1],
        ['hub', 'e', 1],
      ],
    );

    const firstPicks = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const frames = collect(kruskals(graph));
      const accepted = frames.find((f) => f.type === 'accept-edge');
      if (accepted && 'edge' in accepted) firstPicks.add(accepted.edge);
    }

    expect(firstPicks.size).toBeGreaterThan(1);
  });

  it('stops early once the tree is complete, without judging the remaining edges one by one', () => {
    // a-b (1) and b-c (2) already span all three nodes; a-c (9) never gets
    // its own consider-edge/accept-edge/reject-edge turn
    const graph = makeGraph(
      ['a', 'b', 'c'],
      [
        ['a', 'b', 1],
        ['b', 'c', 2],
        ['a', 'c', 9],
      ],
    );
    const frames = collect(kruskals(graph));
    const considered = frames
      .filter((f): f is typeof f & { edge: string } => f.type === 'consider-edge')
      .map((f) => f.edge);
    expect(considered).toEqual(['e0', 'e1']);
  });

  it('waves off every never-considered edge at once when the tree finishes early', () => {
    // same shape as above: a-c (9) is still sitting in sorted order when the
    // tree already spans everything. it should still end up excluded (and
    // therefore faded), just via a single batch announcement instead of a
    // reject-edge frame of its own
    const graph = makeGraph(
      ['a', 'b', 'c'],
      [
        ['a', 'b', 1],
        ['b', 'c', 2],
        ['a', 'c', 9],
      ],
    );
    const frames = collect(kruskals(graph));

    const allConnected = frames.find((f) => f.type === 'all-connected');
    expect(
      allConnected && 'edges' in allConnected ? allConnected.edges : undefined,
    ).toEqual(['e2']);
    expect(frames.some((f) => f.type === 'reject-edge')).toBe(false);
    expect(last(frames).excludedEdgeIds).toEqual(['e2']);
  });

  it('skips the all-connected frame when every edge got its own verdict', () => {
    // exactly two edges for three nodes - nothing is left over once the
    // last one is accepted, so there is nothing to wave off
    const graph = makeGraph(
      ['a', 'b', 'c'],
      [
        ['a', 'b', 1],
        ['b', 'c', 2],
      ],
    );
    const frames = collect(kruskals(graph));
    expect(frames.some((f) => f.type === 'all-connected')).toBe(false);
  });
});
