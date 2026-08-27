import { Explainer } from '@magic/shared/explainer';
import { Graph } from '@magic/shared/graph';

import { createBalanceFactorThemer } from '../createBalanceFactorThemer.ts';
import {
  RotatingNodes,
  createRotationThemer,
} from '../createRotationThemer.ts';
import {
  UnbalancedNodes,
  createUnbalanceThemer,
} from '../createUnbalanceThemer.ts';
import { definitions } from '../definitions.ts';
import { TreeNode } from '../tree/TreeNode.ts';
import { getBalanceFactor } from '../tree/getBalanceFactor.ts';
import { getNodeById } from '../tree/getNodeById.ts';
import { AVLFrame, BalanceMethod, ReplacementMethod } from './frames.ts';

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

const BALANCE_METHOD_TO_DEFINITION: Record<
  BalanceMethod,
  (unbalanced: TreeNode, child: TreeNode) => string
> = {
  'left-left': definitions.unbalance.leftLeft,
  'left-right': definitions.unbalance.leftRight,
  'right-left': definitions.unbalance.rightLeft,
  'right-right': definitions.unbalance.rightRight,
};

export const treeExplainer = (graph: Graph) => {
  let explainedRoot: TreeNode | undefined;
  const balanceFactorThemer = createBalanceFactorThemer(
    graph,
    () => explainedRoot,
  );

  let rotatingNodes: RotatingNodes | undefined;
  const rotationThemer = createRotationThemer(graph, () => rotatingNodes);

  let unbalancedNodes: UnbalancedNodes | undefined;
  const unbalanceThemer = createUnbalanceThemer(graph, () => unbalancedNodes);

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
      const balanceFactor = getBalanceFactor(
        getNodeById(frame.root, frame.unbalancedNode.id),
      );
      return {
        content: `{${frame.unbalancedNode.id}} Is [${BALANCE_METHOD_TO_STRING[frame.method]}] Unbalanced With A [Balance Factor] Of <${balanceFactor}>`,
        highlights: [
          {
            tooltipLabel: BALANCE_METHOD_TO_DEFINITION[frame.method](
              frame.unbalancedNode,
              frame.childNode,
            ),
            activate: () => {
              unbalancedNodes = frame;
              unbalanceThemer.activate();
            },
            deactivate: () => unbalanceThemer.deactivate(),
          },
          {
            tooltipLabel: definitions.balanceFactor,
            activate: () => {
              explainedRoot = frame.root;
              balanceFactorThemer.activate();
            },
            deactivate: () => balanceFactorThemer.deactivate(),
          },
        ],
      };
    }
    if (frame.action === 'rotation') {
      return {
        content: `Rotating [${frame.side}]`,
        highlights: [
          {
            tooltipLabel: definitions.rotation[frame.side](
              frame.rotatedNode,
              frame.promotedNode,
            ),
            activate: () => {
              rotatingNodes = frame;
              rotationThemer.activate();
            },
            deactivate: () => rotationThemer.deactivate(),
          },
        ],
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
    if (frame.action === 'remove-complete') {
      return {
        content: 'Removal Complete, Every Node Is [Balanced]',
        highlights: [
          {
            tooltipLabel: definitions.treeBalance,
            activate: () => {
              explainedRoot = frame.root;
              balanceFactorThemer.activate();
            },
            deactivate: () => balanceFactorThemer.deactivate(),
          },
        ],
      };
    }
    if (frame.action === 'balance-check') {
      return {
        content: 'After Removing A Node, Find All Nodes That Are [Unbalanced]',
        highlights: [
          {
            tooltipLabel: definitions.treeBalance,
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
