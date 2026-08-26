import { Explainer } from '@magic/shared/explainer';

import { AVLFrame, BalanceMethod } from './frames.ts';

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

export const explainer = (frame: AVLFrame): Explainer | undefined => {
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
      content: `This Tree Unbalanced! Performing a [${BALANCE_METHOD_TO_STRING[frame.method]}] Balancing Maneuver`,
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
  if (frame.action === 'compare-removal') {
    return {
      content:
        `Comparing {${frame.targetNode.id}} to {${frame.comparedNode.id}}` +
        (frame.targetNode.id === frame.comparedNode.id ? '. Found It!' : ''),
    };
  }
};
