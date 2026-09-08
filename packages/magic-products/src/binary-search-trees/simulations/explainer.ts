import { Explainer } from '@magic/shared/explainer';
import { Graph } from '@magic/shared/graph';

import { capitalize } from 'vue';

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
import { AVLFrame, BalanceMethod } from './frames.ts';

const BALANCE_METHOD_TO_STRING: Record<BalanceMethod, string> = {
  'left-left': 'Left Left',
  'right-right': 'Right Right',
  'left-right': 'Left Right',
  'right-left': 'Right Left',
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

  /** the tree as the frame left it, under the balance factor of every node */
  const balanceFactorHighlight = (frame: AVLFrame) => ({
    tooltipLabel: definitions.treeBalance,
    activate: () => {
      explainedRoot = frame.root;
      balanceFactorThemer.activate();
    },
    deactivate: () => balanceFactorThemer.deactivate(),
  });

  return (frame: AVLFrame): Explainer | undefined => {
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
          balanceFactorHighlight(frame),
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
    if (frame.action === 'balance-check') {
      return {
        content: 'Find All Nodes That Are [Unbalanced]',
        highlights: [balanceFactorHighlight(frame)],
      };
    }
    if (frame.action === 'balance-complete') {
      return {
        content: 'Balancing Complete, Every Node Is [Balanced]',
        highlights: [balanceFactorHighlight(frame)],
      };
    }
  };
};
