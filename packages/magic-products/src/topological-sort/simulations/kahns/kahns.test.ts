import { describe, expect, it } from 'vitest';

import { kahnsExplainer } from './explainer.ts';
import { KahnsFrame } from './frame.ts';
import { kahns } from './kahns.ts';

type EdgeSpec = [string, string];

const collect = (nodeIds: string[], edgeSpecs: EdgeSpec[]) => {
  const edges = edgeSpecs.map(([source, target], index) => ({
    id: `e${index}`,
    source,
    target,
  }));
  const frames: KahnsFrame[] = [];
  kahns(nodeIds, edges)({ add: (frame) => frames.push(frame) });
  return frames;
};

const last = (frames: KahnsFrame[]) => frames[frames.length - 1];

const DIAMOND: EdgeSpec[] = [
  ['a', 'b'],
  ['a', 'c'],
  ['b', 'd'],
  ['c', 'd'],
];

describe('kahns', () => {
  it('orders a diamond with every node before the nodes it points to', () => {
    const frames = collect(['a', 'b', 'c', 'd'], DIAMOND);
    expect(last(frames)).toMatchObject({
      type: 'end',
      orderedNodeIds: ['a', 'b', 'c', 'd'],
      stuckNodeIds: [],
    });
  });

  it('keeps every edge pointing forward in the final order', () => {
    const edges: EdgeSpec[] = [
      ['e', 'c'],
      ['a', 'c'],
      ['c', 'f'],
      ['b', 'f'],
      ['d', 'b'],
      ['a', 'd'],
    ];
    const { orderedNodeIds } = last(
      collect(['a', 'b', 'c', 'd', 'e', 'f'], edges),
    );
    expect(orderedNodeIds).toHaveLength(6);
    for (const [source, target] of edges) {
      expect(orderedNodeIds.indexOf(source)).toBeLessThan(
        orderedNodeIds.indexOf(target),
      );
    }
  });

  it('places nodes in queue order, so sources come out in node order', () => {
    const frames = collect(['c', 'a', 'b'], []);
    expect(last(frames).orderedNodeIds).toEqual(['c', 'a', 'b']);
  });

  it('counts in-degrees before anything is queued', () => {
    const [first] = collect(['a', 'b', 'c', 'd'], DIAMOND);
    expect(first).toMatchObject({
      type: 'count-in-degrees',
      inDegrees: { a: 0, b: 1, c: 1, d: 2 },
      queuedNodeIds: [],
    });
  });

  it('enqueues a node on the edge removal that drops its in-degree to zero', () => {
    const frames = collect(['a', 'b', 'c', 'd'], DIAMOND);
    const intoD = frames.filter(
      (frame) =>
        (frame.type === 'remove-edge' || frame.type === 'enqueue-node') &&
        frame.node === 'd',
    );
    expect(intoD.map((frame) => frame.type)).toEqual([
      'remove-edge',
      'enqueue-node',
    ]);
    expect(intoD.map((frame) => frame.inDegrees.d)).toEqual([1, 0]);
  });

  it('reports the nodes on and behind a cycle as stuck', () => {
    const frames = collect(
      ['a', 'b', 'c', 'd'],
      [
        ['a', 'b'],
        ['b', 'c'],
        ['c', 'b'],
        ['c', 'd'],
      ],
    );
    expect(last(frames)).toMatchObject({
      orderedNodeIds: ['a'],
      stuckNodeIds: ['b', 'c', 'd'],
    });
  });

  it('skips enqueuing sources when every node has an edge pointing in', () => {
    const frames = collect(
      ['a', 'b'],
      [
        ['a', 'b'],
        ['b', 'a'],
      ],
    );
    expect(frames.map((frame) => frame.type)).toEqual([
      'count-in-degrees',
      'end',
    ]);
  });

  it('treats a self loop as a cycle', () => {
    const frames = collect(['a', 'b'], [['a', 'a']]);
    expect(last(frames)).toMatchObject({
      orderedNodeIds: ['b'],
      stuckNodeIds: ['a'],
    });
  });

  it('fades every edge out of a placed node and leaves the rest', () => {
    const frames = collect(
      ['a', 'b', 'c'],
      [
        ['a', 'b'],
        ['b', 'c'],
        ['c', 'b'],
      ],
    );
    expect(last(frames).removedEdgeIds).toEqual(['e0']);
  });
});

describe('kahnsExplainer', () => {
  const runs = [
    collect(['a', 'b', 'c', 'd'], DIAMOND),
    collect(
      ['a', 'b', 'c'],
      [
        ['a', 'b'],
        ['b', 'c'],
        ['c', 'b'],
      ],
    ),
  ];

  it('gives every bracketed segment a highlight', () => {
    for (const frame of runs.flat()) {
      const explainer = kahnsExplainer(frame);
      const bracketed = String(explainer?.content).match(/\[[^\]]*\]/g) ?? [];
      expect(explainer?.highlights).toHaveLength(bracketed.length);
    }
  });
});
