import { useVisibleWorldRect } from '@canvas/surface/coordinates/visibleWorldRect';
import { CanvasSurface } from '@canvas/surface/types';
import { placeOnboardingGraph } from '@magic/shared/graph-shell/onboarding-graph/layout';
import { describe, expect, it } from 'vitest';

import { ref } from 'vue';

import { graphToTree } from './graph-conversion/graphToTree.ts';
import { ROOT_POSITION } from './graph-conversion/treeToGraph.ts';
import {
  centerCameraOnStartingTree,
  onboardingGraph,
} from './onboardingGraph.ts';
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

describe('the binary search tree onboarding graph', () => {
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

  /*
    the offsets are read against whatever is on screen, but every tree this product
    draws is laid out from ROOT_POSITION. so the camera move and the offsets have to
    cancel out exactly, or the first insert would snap the whole tree somewhere else
  */
  it('lands its root on ROOT_POSITION once the camera has been centered', () => {
    const state = { panX: ref(0), panY: ref(0), zoom: ref(1) };
    const canvasSize = { width: ref(1000), height: ref(800) };

    const surface = {
      camera: {
        state,
        actions: {
          moveTo: ({ panX, panY, zoom }: Record<string, number>) => {
            state.panX.value = panX;
            state.panY.value = panY;
            state.zoom.value = zoom;
          },
        },
      },
      visibleWorldRect: useVisibleWorldRect(state, canvasSize),
    } as unknown as CanvasSurface;

    centerCameraOnStartingTree(surface);

    const { nodes } = placeOnboardingGraph(
      onboardingGraph,
      surface.visibleWorldRect.value,
    );

    expect(nodes[0].position).toEqual(ROOT_POSITION);
  });
});
