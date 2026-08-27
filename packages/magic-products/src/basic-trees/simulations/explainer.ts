import { Explainer } from '@magic/shared/explainer';
import { Graph } from '@magic/shared/graph';

import { createBalanceFactorThemer } from '../createBalanceFactorThemer.ts';
import { TreeNode } from '../tree/TreeNode.ts';
import { getBalanceFactor } from '../tree/getBalanceFactor.ts';
import { getNodeById } from '../tree/getNodeById.ts';
import { AVLFrame, BalanceMethod, ReplacementMethod } from './frames.ts';

const BALANCE_FACTOR_DEFINITION =
  "The height of a node's left subtree minus the height of its right subtree. Anything outside -1 to 1 means the node has to be rebalanced.";

type PromotableMethod = Exclude<ReplacementMethod, 'leaf'>;

const REPLACEMENT_METHOD_TO_STRING: Record<PromotableMethod, string> = {
  'only-left-child': 'Its Only Child',
  'only-right-child': 'Its Only Child',
  successor: 'Its In Order Successor',
};

const REPLACEMENT_METHOD_TO_DEFINITION: Record<PromotableMethod, string> = {
  'only-left-child':
    'The removed node has nothing on its right, so its left child moves straight up without disturbing any ordering.',
  'only-right-child':
    'The removed node has nothing on its left, so its right child moves straight up without disturbing any ordering.',
  successor:
    'The removed node has two children, so the smallest value in its right subtree moves up. That value sits between both subtrees, which is exactly what the slot needs.',
};

const BALANCE_METHOD_TO_STRING: Record<BalanceMethod, string> = {
  'left-left': 'Left Left',
  'left-right': 'Left Right',
  'right-left': 'Right Left',
  'right-right': 'Right Right',
};

const BALANCE_METHOD_TO_DEFINITION: Record<BalanceMethod, string> = {
  'left-left':
    'The node is left-heavy and its left child is also left-heavy (or balanced). A single right rotation on the node restores balance.',
  'left-right':
    'The node is left-heavy but its left child is right-heavy. A left rotation on the left child followed by a right rotation on the node restores balance.',
  'right-left':
    'The node is right-heavy but its right child is left-heavy. A right rotation on the right child followed by a left rotation on the node restores balance.',
  'right-right':
    'The node is right-heavy and its right child is also right-heavy (or balanced). A single left rotation on the node restores balance.',
};

export const treeExplainer = (graph: Graph) => {
  let explainedRoot: TreeNode | undefined;
  const balanceFactorThemer = createBalanceFactorThemer(
    graph,
    () => explainedRoot,
  );

  return (frame: AVLFrame): Explainer | undefined => {
    if (frame.action === 'compare') {
      return {
        content: `Comparing {${frame.targetNode.id}} to {${frame.comparedNode.id}}`,
      };
    }
    if (frame.action === 'compare-duplicate-found') {
      return {
        content: `{${frame.preexistingNode.id}} Already Exists!`,
      };
    }
    if (frame.action === 'balance') {
      return {
        content: `This Tree Is Unbalanced! Performing a [${BALANCE_METHOD_TO_STRING[frame.method]}] Balancing Maneuver`,
        highlights: [
          {
            tooltipLabel: BALANCE_METHOD_TO_DEFINITION[frame.method],
          },
        ],
      };
    }
    if (frame.action === 'rotation') {
      return {
        content: 'Rotating ' + frame.side,
      };
    }
    if (frame.action === 'insert') {
      return {
        content: `Inserting {${frame.targetNode.id}}`,
      };
    }
    if (frame.action === 'remove') {
      return {
        content: `Removing [${frame.targetNodeValue}]`,
        highlights: [{}],
      };
    }
    if (frame.action === 'find-replacement') {
      if (frame.method === 'leaf') {
        return {
          content: `{${frame.removedNode.id}} Has No Children, So Nothing Fills Its Slot`,
        };
      }
      return {
        content: `{${frame.replacementNode.id}} Fills The Slot {${frame.removedNode.id}} Leaves Behind, [${REPLACEMENT_METHOD_TO_STRING[frame.method]}]`,
        highlights: [
          {
            tooltipLabel: REPLACEMENT_METHOD_TO_DEFINITION[frame.method],
          },
        ],
      };
    }
    if (frame.action === 'balance-check') {
      const balanceFactor = getBalanceFactor(
        getNodeById(frame.root, frame.checkedNode.id),
      );
      return {
        content: `Is Tree Balanced? {${frame.checkedNode.id}}s [Balance Factor] Is <${balanceFactor}>`,
        highlights: [
          {
            tooltipLabel: BALANCE_FACTOR_DEFINITION,
            activate: () => {
              explainedRoot = frame.root;
              balanceFactorThemer.activate();
            },
            deactivate: () => balanceFactorThemer.deactivate(),
          },
        ],
      };
    }
  };
};
