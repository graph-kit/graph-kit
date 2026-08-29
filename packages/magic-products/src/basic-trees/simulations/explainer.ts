import { Explainer } from '@magic/shared/explainer';
import { Graph } from '@magic/shared/graph';

import { capitalize } from 'vue';

import { createBalanceFactorThemer } from '../createBalanceFactorThemer.ts';
import { createChildrenThemer } from '../createChildrenThemer.ts';
import {
  RotatingNodes,
  createRotationThemer,
} from '../createRotationThemer.ts';
import { createSubtreeThemer } from '../createSubtreeThemer.ts';
import {
  UnbalancedNodes,
  createUnbalanceThemer,
} from '../createUnbalanceThemer.ts';
import { definitions } from '../definitions.ts';
import { TreeNode } from '../tree/TreeNode.ts';
import { getNodeById } from '../tree/getNodeById.ts';
import { AVLFrame, BalanceMethod, ReplacementMethod } from './frames.ts';

type PromotableMethod = Exclude<ReplacementMethod, 'leaf'>;

const REPLACEMENT_METHOD_TO_DEFINITION: Record<
  PromotableMethod,
  (removed: TreeNode, replacement: TreeNode) => string
> = {
  'only-left-child': definitions.replacement.onlyLeftChild,
  'only-right-child': definitions.replacement.onlyRightChild,
  successor: definitions.replacement.bothChildren,
};

const BALANCE_METHOD_TO_STRING: Record<BalanceMethod, string> = {
  'left-left': 'Left Left',
  'left-right': 'Left Right',
  'right-left': 'Right Left',
  'right-right': 'Right Right',
};

const BALANCE_METHOD_TO_DEFINITION: Record<
  BalanceMethod,
  (unbalanced: TreeNode, child: TreeNode, childBalanceFactor: number) => string
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

  let childrenParent: TreeNode | undefined;
  const childrenThemer = createChildrenThemer(graph, () => childrenParent);

  let subtreeRoot: TreeNode | undefined;
  const subtreeThemer = createSubtreeThemer(graph, () => subtreeRoot);

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
        content: `{${frame.unbalancedNode.id}} Is [${BALANCE_METHOD_TO_STRING[frame.method]}] [Unbalanced]`,
        highlights: [
          {
            tooltipLabel: BALANCE_METHOD_TO_DEFINITION[frame.method](
              frame.unbalancedNode,
              frame.childNode,
              frame.childBalanceFactor,
            ),
            activate: () => {
              unbalancedNodes = frame;
              unbalanceThemer.activate();
            },
            deactivate: () => unbalanceThemer.deactivate(),
          },
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
    if (frame.action === 'rotation') {
      return {
        content: `Rotating [${capitalize(frame.side)}]`,
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
          content: `{${frame.removedNode.id}} Has [No Children], So Nothing Takes Its Place`,
          highlights: [
            {
              tooltipLabel: definitions.replacement.noChildren(
                frame.removedNode,
              ),
            },
          ],
        };
      }
      const removedNode = getNodeById(frame.root, frame.removedNode.id);
      const childrenHighlight = {
        tooltipLabel: REPLACEMENT_METHOD_TO_DEFINITION[frame.method](
          frame.removedNode,
          frame.replacementNode,
        ),
        activate: () => {
          childrenParent = removedNode;
          childrenThemer.activate();
        },
        deactivate: () => childrenThemer.deactivate(),
      };

      if (frame.method === 'successor') {
        return {
          content: `{${frame.removedNode.id}} Has [Two Children], So The Smallest Value In Its [Right Subtree], {${frame.replacementNode.id}}, Takes Its Place`,
          highlights: [
            childrenHighlight,
            {
              activate: () => {
                subtreeRoot = removedNode?.right;
                subtreeThemer.activate();
              },
              deactivate: () => subtreeThemer.deactivate(),
            },
          ],
        };
      }

      return {
        content: `{${frame.removedNode.id}} Has [One Child], So {${frame.replacementNode.id}} Takes Its Place`,
        highlights: [childrenHighlight],
      };
    }
    if (frame.action === 'insert-complete') {
      return {
        content: 'Insertion Complete, Every Node Is [Balanced]',
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
        content: 'After Removing, Find All Nodes That Are [Unbalanced]',
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
