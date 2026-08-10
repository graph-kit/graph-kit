import Fraction from 'fraction.js';
import { describe, expect, it } from 'vitest';

import { prims } from './prims.ts';

/** source, target, weight. the weight is anything `new Fraction()` takes */
type EdgeSpec = [string, string, number | string];

/*
  prims only reads three things off a graph: the node list, the edge list
  (already carrying its weight, the way `graph.edges.value` really does), and
  whether it is directed. standing those up by hand keeps this from needing a
  canvas to run on, mirroring path-finding/simulations/algorithms.test.ts
*/
const makeGraph = (
  nodeIds: string[],
  edges: EdgeSpec[],
  directed = false,
): any => ({
  nodes: { value: nodeIds.map((id) => ({ id })) },
  edges: {
    value: edges.map(([source, target, weight], index) => ({
      id: `e${index}`,
      source,
      target,
      weight: new Fraction(weight),
    })),
  },
  metadata: { directed },
});

const collect = <F>(run: (c: { add: (frame: F) => void }) => void) => {
  const frames: F[] = [];
  run({ add: (frame) => frames.push(frame) });
  return frames;
};

const last = <F>(frames: F[]) => frames[frames.length - 1];

describe('prims', () => {
  it('grows a minimum spanning tree from the start node', () => {
    // triangle: a-b 1, b-c 2, a-c 9 -> cheapest tree is a-b, b-c
    const graph = makeGraph(
      ['a', 'b', 'c'],
      [
        ['a', 'b', 1],
        ['b', 'c', 2],
        ['a', 'c', 9],
      ],
    );
    const frames = collect(prims(graph, 'a'));
    expect(last(frames).type).toBe('end');
    expect(last(frames).treeEdgeIds).toEqual(['e0', 'e1']);
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
    const frames = collect(prims(graph, 'a'));
    expect(last(frames).treeEdgeIds).toEqual(['e1']);
  });

  it('reports nodes the start node cannot reach', () => {
    const graph = makeGraph(['a', 'b', 'z'], [['a', 'b', 5]]);
    const frames = collect(prims(graph, 'a'));
    const unreachable = frames.find((f) => f.type === 'unreachable');
    expect(unreachable && 'nodes' in unreachable && unreachable.nodes).toEqual(
      ['z'],
    );
    expect([...last(frames).treeNodeIds].sort()).toEqual(['a', 'b']);
  });

  it('calls out a tie instead of breaking it silently', () => {
    const graph = makeGraph(
      ['a', 'b', 'c'],
      [
        ['a', 'b', 2],
        ['a', 'c', 2],
      ],
    );
    const frames = collect(prims(graph, 'a'));
    const selected = frames.find((f) => f.type === 'select-edge');
    expect(selected && 'tiedEdges' in selected ? selected.tiedEdges : undefined).toEqual(
      ['e0', 'e1'],
    );
  });

  it('gives selectedEdge to only the edge actually being added, not the whole candidate set', () => {
    const graph = makeGraph(
      ['a', 'b', 'c'],
      [
        ['a', 'b', 5],
        ['a', 'c', 1],
      ],
    );
    const frames = collect(prims(graph, 'a'));
    const selected = frames.find((f) => f.type === 'select-edge');
    expect(selected?.selectedEdge).toBe('e1');
    expect(selected?.candidateEdges).toContain('e0');
  });

  it('does not emit a comparison when there is only one candidate to weigh', () => {
    const graph = makeGraph(['a', 'b', 'z'], [['a', 'b', 5]]);
    const frames = collect(prims(graph, 'a'));
    expect(frames.some((f) => f.type === 'compare-edges')).toBe(false);
  });

  it('weighs candidates one comparison at a time, exposing exactly the pair in play', () => {
    // a's round-1 candidates are a-b (5), a-c (1) and a-d (4) - three
    // candidates means two comparisons in a left-to-right scan. isolating
    // frames up to the first select-edge keeps this to round 1, since later
    // rounds have their own, smaller candidate sets
    const graph = makeGraph(
      ['a', 'b', 'c', 'd'],
      [
        ['a', 'b', 5],
        ['a', 'c', 1],
        ['a', 'd', 4],
      ],
    );
    const frames = collect(prims(graph, 'a'));
    const firstSelectIndex = frames.findIndex((f) => f.type === 'select-edge');
    const round1 = frames.slice(0, firstSelectIndex + 1);

    const comparisons = round1.filter(
      (f): f is typeof f & { left: string; right: string } =>
        f.type === 'compare-edges',
    );
    expect(comparisons).toHaveLength(2);

    for (const comparison of comparisons) {
      expect(comparison.currentComparison).toEqual([
        comparison.left,
        comparison.right,
      ]);
      // the pair being weighed is still just two of the full candidate set
      expect(comparison.candidateEdges).toEqual(['e0', 'e1', 'e2']);
    }

    const selected = round1.at(-1);
    expect(selected?.type).toBe('select-edge');
    expect(selected?.selectedEdge).toBe('e1');
    // nothing is mid-comparison once a pick has been made
    expect(selected?.currentComparison).toBeUndefined();
  });

  it('maintains the candidate set incrementally: a passed-over candidate stays eligible next round, and a resolved one drops out', () => {
    // a-b (5) loses to a-c (1) in round 1 but is still a live candidate -
    // only c-b (100) is close enough to matter for what round 2 looks at
    const graph = makeGraph(
      ['a', 'b', 'c'],
      [
        ['a', 'b', 5],
        ['a', 'c', 1],
        ['c', 'b', 100],
      ],
    );
    const frames = collect(prims(graph, 'a'));

    const rounds = frames.filter((f) => f.type === 'consider-edges');
    expect(rounds).toHaveLength(2);
    expect(rounds[0].candidateEdges).toEqual(['e0', 'e1']);
    // a-c (e1) is resolved and gone; a-b (e0) is still there, and c-b (e2)
    // is newly reachable now that c is in the tree
    expect(rounds[1].candidateEdges).toEqual(['e0', 'e2']);
  });

  it('marks a considered edge as excluded once both its ends are in the tree without it', () => {
    // a-b (1) wins round 1. a-c (100) stays a live candidate through round 1,
    // but once c joins via b-c (1) in round 2, a-c would only close a cycle -
    // it's excluded from that point on, and it was never a tree edge itself
    const graph = makeGraph(
      ['a', 'b', 'c'],
      [
        ['a', 'b', 1],
        ['b', 'c', 1],
        ['a', 'c', 100],
      ],
    );
    const frames = collect(prims(graph, 'a'));

    // not excluded yet while it's still a genuine, live candidate
    const round1Consider = frames.find((f) => f.type === 'consider-edges');
    expect(round1Consider?.excludedEdgeIds).toEqual([]);
    expect(round1Consider?.candidateEdges).toContain('e2');

    expect(last(frames).excludedEdgeIds).toEqual(['e2']);
    expect(last(frames).treeEdgeIds).toEqual(['e0', 'e1']);
  });

  it('announces an exclude-edges frame the moment an edge is ruled out, naming just that edge', () => {
    // same shape as the test above: a-c (e2) is the one that gets ruled out
    // once b-c closes the triangle. the announcement should fire right then,
    // not just show up passively in excludedEdgeIds later
    const graph = makeGraph(
      ['a', 'b', 'c'],
      [
        ['a', 'b', 1],
        ['b', 'c', 1],
        ['a', 'c', 100],
      ],
    );
    const frames = collect(prims(graph, 'a'));

    const excludeFrames = frames.filter(
      (f): f is typeof f & { edges: string[] } => f.type === 'exclude-edges',
    );
    expect(excludeFrames).toHaveLength(1);
    expect(excludeFrames[0].edges).toEqual(['e2']);
  });

  it('never marks an edge excluded if the tree has not reached either of its ends', () => {
    // c-d never becomes a candidate at all, since neither c nor d is ever in
    // the tree - it should read as untouched, not as ruled out
    const graph = makeGraph(
      ['a', 'b', 'c', 'd'],
      [
        ['a', 'b', 1],
        ['c', 'd', 1],
      ],
    );
    const frames = collect(prims(graph, 'a'));
    expect(last(frames).excludedEdgeIds).toEqual([]);
  });

  it('anchors activeNodeId to wherever the winning edge actually comes from, not just the last node grown', () => {
    // hub-a (1) wins round 1, growing the tree to {hub, a}. round 2's
    // cheapest edge is hub-b (2), which comes from hub - not from a, the
    // node that grew the tree last - so activeNodeId must follow the edge,
    // not the history of which node was added most recently
    const graph = makeGraph(
      ['hub', 'a', 'b'],
      [
        ['hub', 'a', 1],
        ['hub', 'b', 2],
        ['a', 'b', 100],
      ],
    );
    const frames = collect(prims(graph, 'hub'));

    const selectEdgeFrames = frames.filter(
      (f): f is typeof f & { edge: string } => f.type === 'select-edge',
    );

    expect(selectEdgeFrames).toHaveLength(2);
    expect(selectEdgeFrames[0].edge).toBe('e0'); // hub-a
    expect(selectEdgeFrames[0].activeNodeId).toBe('hub');
    expect(selectEdgeFrames[1].edge).toBe('e1'); // hub-b
    expect(selectEdgeFrames[1].activeNodeId).toBe('hub'); // from hub, not 'a'
  });

  it('has no single activeNodeId while the whole candidate set is being weighed at once', () => {
    // with two candidates from the same start, nothing is singularly
    // "active" yet - the comparison spans the whole cut, so pinning the
    // highlight to one node would misrepresent it as a local decision
    const graph = makeGraph(
      ['a', 'b', 'c'],
      [
        ['a', 'b', 5],
        ['a', 'c', 1],
      ],
    );
    const frames = collect(prims(graph, 'a'));
    const considered = frames.find((f) => f.type === 'consider-edges');
    expect(considered?.activeNodeId).toBeUndefined();
  });

  it('breaks ties arbitrarily rather than always favoring the earliest edge', () => {
    // a star of five equally-cheap spokes: every run has a 1-in-5 chance of
    // picking e0 first if ties are broken fairly. running it a few dozen
    // times should see more than one winner - a flaky-looking test here is
    // actually the point, since it's proof the tie-break isn't deterministic
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
      const frames = collect(prims(graph, 'hub'));
      const selected = frames.find((f) => f.type === 'select-edge');
      if (selected?.selectedEdge) firstPicks.add(selected.selectedEdge);
    }

    expect(firstPicks.size).toBeGreaterThan(1);
  });

  it('walks undirected edges both ways by default', () => {
    const graph = makeGraph(
      ['a', 'b', 'c'],
      [
        ['b', 'a', 1],
        ['c', 'b', 2],
      ],
    );
    const frames = collect(prims(graph, 'a'));
    expect([...last(frames).treeEdgeIds].sort()).toEqual(['e0', 'e1']);
  });
});
