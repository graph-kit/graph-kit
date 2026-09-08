import { TreeNode } from '../tree/TreeNode.ts';

export type BalanceMethod =
  'left-left' | 'right-right' | 'left-right' | 'right-left';

export type RotationSide = 'left' | 'right';

type BalanceCheckFrame = {
  action: 'balance-check';
};

type BalanceCompleteFrame = {
  action: 'balance-complete';
};

type BalanceFrame = {
  action: 'balance';
  method: BalanceMethod;
  unbalancedNode: TreeNode;
  childNode: TreeNode;
  // captured here because childNode is a live reference that later rotations mutate
  childBalanceFactor: number;
};

type RotationFrame = {
  action: 'rotation';
  side: RotationSide;
  rotatedNode: TreeNode;
  promotedNode: TreeNode;
};

export type AVLFrameNoRoot =
  BalanceCheckFrame | BalanceCompleteFrame | BalanceFrame | RotationFrame;

export type AVLFrame = AVLFrameNoRoot & { root: TreeNode | undefined };
