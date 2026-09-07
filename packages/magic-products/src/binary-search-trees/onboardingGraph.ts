import { CanvasSurface } from '@canvas/surface/types';
import { OnboardingGraph } from '@magic/shared/graph-shell';

import { centerCameraOnTree } from './centerCameraOnTree.ts';
import { treeToGraph } from './graph-conversion/treeToGraph.ts';
import { TreeNode } from './tree/TreeNode.ts';

const node = (id: string, value: number) => new TreeNode({ id, value });

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

export const centerCameraOnStartingTree = (surface: CanvasSurface) =>
  centerCameraOnTree(surface, ROOT_OFFSET);
