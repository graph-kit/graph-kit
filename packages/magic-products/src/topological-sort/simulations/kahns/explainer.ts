import { Explainer, ExplainerHighlight } from '@magic/shared/explainer';

import { KahnsFrame } from './frame.ts';
import { slotIds } from './slotIds.ts';

const componentSlotHighlight = (
  slot: keyof typeof slotIds,
): ExplainerHighlight => ({
  activate: ({ shell }) => shell.componentSlots.setHighlighted(slotIds[slot]),
  deactivate: ({ shell }) => shell.componentSlots.clearHighlighted(),
});

const highlights = {
  dequeue: {
    tooltipLabel: 'Dequeue removes the first node in the queue.',
    ...componentSlotHighlight('queue'),
  },
  enqueue: {
    tooltipLabel: 'Enqueue adds a node to the back of the queue.',
    ...componentSlotHighlight('queue'),
  },
  inDegree: {
    tooltipLabel:
      'How many edges still point into a node, shown on every node not yet placed.',
  },
  order: {
    tooltipLabel:
      'The topological ordering so far. Every node comes before the nodes it points to.',
    ...componentSlotHighlight('order'),
  },
  queue: {
    tooltipLabel:
      'A FIFO data structure. The first node in is the first node out.',
    ...componentSlotHighlight('queue'),
  },
} as const satisfies Record<string, ExplainerHighlight>;

export const kahnsExplainer = (frame: KahnsFrame): Explainer | undefined => {
  if (frame.type === 'count-in-degrees') {
    return {
      content: "Counting Every Node's [In-Degree]",
      highlights: [highlights.inDegree],
    };
  }

  if (frame.type === 'enqueue-sources') {
    return {
      content: '[Enqueuing] Every Node With an [In-Degree] of <0>',
      highlights: [highlights.enqueue, highlights.inDegree],
    };
  }

  if (frame.type === 'place-node') {
    return {
      content: `[Dequeuing] {${frame.node}} and Placing It Next in the [Order]`,
      highlights: [highlights.dequeue, highlights.order],
    };
  }

  if (frame.type === 'remove-edge') {
    return {
      content: `Removing Edge {${frame.edge}}, Leaving {${frame.node}} With an [In-Degree] of <${frame.inDegrees[frame.node]}>`,
      highlights: [highlights.inDegree],
    };
  }

  if (frame.type === 'enqueue-node') {
    return {
      content: `Removing Edge {${frame.edge}} Drops {${frame.node}}'s [In-Degree] to <0>, Therefore, [Enqueuing]`,
      highlights: [highlights.inDegree, highlights.enqueue],
    };
  }

  const stuck = frame.stuckNodeIds.length;
  if (stuck === 0) {
    return {
      content:
        'Done! Every Node Is in the [Order], Each Before the Nodes It Points To',
      highlights: [highlights.order],
    };
  }

  return {
    content: `The [Queue] Is Empty but <${stuck}> Node${stuck === 1 ? '' : 's'} Still Have Edges Pointing In. They Sit On or Behind a Cycle, So No Ordering Exists`,
    highlights: [highlights.queue],
  };
};
