import { centerCameraOn } from '@canvas/surface/camera/centerCameraOn';
import { CanvasSurface } from '@canvas/surface/types';
import { OnboardingGraph } from '@magic/shared/graph-shell';

import { ROOT_POSITION, treeToGraph } from './graph-conversion/treeToGraph.ts';
import { TreeNode } from './tree/TreeNode.ts';

const node = (id: string, value: number) => new TreeNode({ id, value });

/** left heavy on purpose, so the balance factor opens on a rotation worth making */
const startingTree = () => {
  const root = node('a', 30);
  root.left = node('b', 20);
  root.right = node('c', 40);
  root.left.left = node('d', 10);
  root.left.left.left = node('e', 5);

  return root;
};

/** offset so a tree that leans this far left still lands on screen */
const ROOT_OFFSET = { x: 120, y: -300 };

export const onboardingGraph: OnboardingGraph = treeToGraph(
  startingTree(),
  ROOT_OFFSET,
);

/**
 * every tree this product draws is laid out from {@link ROOT_POSITION}, so the camera
 * has to sit where {@link ROOT_OFFSET} lands the root exactly on it
 */
export const centerCameraOnStartingTree = (surface: CanvasSurface) =>
  centerCameraOn(surface, {
    x: ROOT_POSITION.x - ROOT_OFFSET.x,
    y: ROOT_POSITION.y - ROOT_OFFSET.y,
  });
