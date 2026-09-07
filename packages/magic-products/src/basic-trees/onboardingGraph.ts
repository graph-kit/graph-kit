import { OnboardingGraph } from '@magic/shared/graph-shell';

import { treeToGraph } from './graph-conversion/treeToGraph.ts';
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
export const onboardingGraph: OnboardingGraph = treeToGraph(startingTree(), {
  x: 120,
  y: -300,
});
