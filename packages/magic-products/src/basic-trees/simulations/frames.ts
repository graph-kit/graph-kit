import { NodePayload, TreeNode } from '../tree/TreeNode.ts';

export type BalanceMethod =
  'left-left' | 'right-right' | 'left-right' | 'right-left';

export type RotationSide = 'left' | 'right';

export type CompareFrame = {
  action: 'compare';
  comparedNode: TreeNode;
  targetNode: NodePayload;
};

/** where the node taking a removed node's place comes from */
export type ReplacementMethod =
  'leaf' | 'only-left-child' | 'only-right-child' | 'successor';

type FindReplacementFrame =
  | {
      action: 'find-replacement';
      method: 'leaf';
      removedNode: TreeNode;
    }
  | {
      action: 'find-replacement';
      method: Exclude<ReplacementMethod, 'leaf'>;
      removedNode: TreeNode;
      replacementNode: TreeNode;
    };

type BalanceCheckFrame = {
  action: 'balance-check';
};

type CompareDuplicateFound = {
  action: 'compare-duplicate-found';
  preexistingNode: TreeNode;
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

type InsertFrame = {
  action: 'insert';
  targetNode: NodePayload;
};

type RemoveFrame = {
  action: 'remove';
  // keyed by value rather than id, since the node is gone by the time this frame is read
  targetNodeValue: NodePayload['value'] | undefined;
};

type RemoveCompleteFrame = {
  action: 'remove-complete';
};

type InsertCompleteFrame = {
  action: 'insert-complete';
};

export type AVLFrameNoRoot =
  | CompareFrame
  | CompareDuplicateFound
  | FindReplacementFrame
  | BalanceCheckFrame
  | BalanceFrame
  | RotationFrame
  | InsertFrame
  | RemoveFrame
  | RemoveCompleteFrame
  | InsertCompleteFrame;

export type AVLFrame = AVLFrameNoRoot & { root: TreeNode | undefined };

export type AVLMode = 'insert' | 'remove';
