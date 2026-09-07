import { BoundingBox } from '@core/utils/canvas/index';
import { describe, expect, it } from 'vitest';

import { adoptExistingNodes, placeOnboardingGraph } from './layout.ts';
import { OnboardingGraph } from './types.ts';

/** centered on (500, 300), so an offset of zero lands there */
const VIEWPORT: BoundingBox = {
  at: { x: 400, y: 100 },
  width: 200,
  height: 400,
};

const graphOf = (nodes: OnboardingGraph['nodes']): OnboardingGraph => ({
  nodes,
  edges: [],
});

describe('placeOnboardingGraph', () => {
  it('puts a node with no offset at the center of the viewport', () => {
    const { nodes } = placeOnboardingGraph(
      graphOf([{ id: 'a', position: { x: 0, y: 0 } }]),
      VIEWPORT,
    );

    expect(nodes[0].position).toEqual({ x: 500, y: 300 });
  });

  it('reads a position as an offset from that center', () => {
    const { nodes } = placeOnboardingGraph(
      graphOf([{ id: 'a', position: { x: -120, y: 40 } }]),
      VIEWPORT,
    );

    expect(nodes[0].position).toEqual({ x: 380, y: 340 });
  });

  it('leaves everything else on a node alone', () => {
    const { nodes } = placeOnboardingGraph(
      graphOf([{ id: 'a', label: 'A', position: { x: 0, y: 0 } }]),
      VIEWPORT,
    );

    expect(nodes[0]).toMatchObject({ id: 'a', label: 'A' });
  });

  it('hands the edges back untouched', () => {
    const edges = [{ source: 'a', target: 'b' }];

    const placed = placeOnboardingGraph(
      { nodes: [{ id: 'a', position: { x: 0, y: 0 } }], edges },
      VIEWPORT,
    );

    expect(placed.edges).toEqual(edges);
  });

  it('throws on a node it was given no position for', () => {
    expect(() =>
      placeOnboardingGraph(graphOf([{ id: 'a' }]), VIEWPORT),
    ).toThrow('onboarding graph node was given no position');
  });
});

describe('adoptExistingNodes', () => {
  const STARTING: OnboardingGraph = {
    nodes: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
    edges: [
      { source: 'a', target: 'b' },
      { source: 'b', target: 'c' },
    ],
  };

  it('hands each node the id of the one it replaces', () => {
    const { nodes } = adoptExistingNodes(STARTING, ['x1', 'x2', 'x3']);

    expect(nodes.map(({ id }) => id)).toEqual(['x1', 'x2', 'x3']);
  });

  it('follows those ids through the edges', () => {
    const { edges } = adoptExistingNodes(STARTING, ['x1', 'x2', 'x3']);

    expect(edges).toEqual([
      { source: 'x1', target: 'x2' },
      { source: 'x2', target: 'x3' },
    ]);
  });

  it('leaves the nodes it has nothing to replace on their own ids', () => {
    const { nodes, edges } = adoptExistingNodes(STARTING, ['x1']);

    expect(nodes.map(({ id }) => id)).toEqual(['x1', 'b', 'c']);
    expect(edges[0]).toEqual({ source: 'x1', target: 'b' });
  });

  it('ignores existing nodes the starting graph has no room for', () => {
    const { nodes } = adoptExistingNodes(STARTING, ['x1', 'x2', 'x3', 'x4']);

    expect(nodes.map(({ id }) => id)).toEqual(['x1', 'x2', 'x3']);
  });

  it('leaves an empty canvas alone', () => {
    expect(adoptExistingNodes(STARTING, [])).toEqual(STARTING);
  });

  it('throws on a node it was given no id for', () => {
    expect(() => adoptExistingNodes(graphOf([{}]), ['x1'])).toThrow(
      'onboarding graph node was given no id',
    );
  });
});
