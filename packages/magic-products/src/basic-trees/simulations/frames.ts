import { NodePayload, TreeNode } from '../tree/TreeNode.ts';

export type BalanceMethod =
  'left-left' | 'right-right' | 'left-right' | 'right-left';

export type RotationSide = 'left' | 'right';

export type CompareFrame = {
  action: 'compare';
  comparedNode: TreeNode;
  targetNode: NodePayload;
};

type CompareForRemovalFrame = {
  action: 'compare-removal';
  comparedNode: TreeNode;
  targetNode: NodePayload;
};

type CompareDuplicateFound = {
  action: 'compare-duplicate-found';
  preexistingNode: TreeNode;
};

type BalanceFrame = {
  action: 'balance';
  method: BalanceMethod;
};

type RotationFrame = {
  action: 'rotation';
  side: RotationSide;
};

type InsertFrame = {
  action: 'insert';
  targetNode: NodePayload;
};

type RemoveFrame = {
  action: 'remove';
  // keyed by value rather than id, since the node is gone by the time this frame is read
  targetNodeValue: NodePayload['value'] | undefined;
};

export type AVLFrameNoRoot =
  | CompareFrame
  | CompareForRemovalFrame
  | CompareDuplicateFound
  | BalanceFrame
  | RotationFrame
  | InsertFrame
  | RemoveFrame;

export type AVLFrame = AVLFrameNoRoot & { root: TreeNode | undefined };

export type AVLMode = 'insert' | 'remove';
