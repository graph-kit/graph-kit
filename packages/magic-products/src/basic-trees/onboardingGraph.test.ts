import { describe, expect, it } from 'vitest';

import { graphToTree } from './graph-conversion/graphToTree.ts';
import { onboardingGraph } from './onboardingGraph.ts';
import { getBalanceFactor } from './tree/getBalanceFactor.ts';

/*
  the tree is rebuilt off the graph once the starting graph is built, so what the
  product ends up holding is whatever graphToTree reads back out of these nodes and
  edges, not the tree they were authored from
*/
const asGraph = (): any => ({
  nodes: { value: onboardingGraph.nodes },
  edges: { value: onboardingGraph.edges },
  getNode: (id: string) => onboardingGraph.nodes.find((node) => node.id === id),
});

describe('the avl onboarding graph', () => {
  it('reads back as the tree it was authored from', () => {
    const root = graphToTree(asGraph());

    expect(root).toMatchObject({ value: 30 });
    expect(root?.left).toMatchObject({ value: 20 });
    expect(root?.right).toMatchObject({ value: 40 });
    expect(root?.left?.left).toMatchObject({ value: 10 });
    expect(root?.left?.left?.left).toMatchObject({ value: 5 });
  });

  it('leans far enough to need a rotation', () => {
    expect(Math.abs(getBalanceFactor(graphToTree(asGraph())))).toBeGreaterThan(
      1,
    );
  });

  it('gives every node a position to be placed at', () => {
    for (const node of onboardingGraph.nodes) {
      expect(node.position).toBeDefined();
    }
  });
});
