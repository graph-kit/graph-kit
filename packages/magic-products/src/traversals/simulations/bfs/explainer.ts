import { Explainer, ExplainerHighlight } from '@magic/shared/explainer';
import { Graph } from '@magic/shared/graph';

import { BfsFrame } from './frame.ts';
import { slotIds } from './lens.ts';

const componentSlotHighlight = (
  slot: keyof typeof slotIds,
): ExplainerHighlight => ({
  activate: ({ shell }) => shell.componentSlots.setHighlighted(slotIds[slot]),
  deactivate: ({ shell }) => shell.componentSlots.clearHighlighted(),
});

const highlights = {
  queue: {
    tooltipLabel:
      'A FIFO data structure. The first node in is the first node out.',
    ...componentSlotHighlight('queue'),
  },
  enqueue: {
    tooltipLabel: 'Enqueue adds a node to the back of the queue.',
    ...componentSlotHighlight('queue'),
  },
  dequeue: {
    tooltipLabel: 'Dequeue removes the first node in the queue.',
    ...componentSlotHighlight('queue'),
  },
  visited: {
    tooltipLabel: 'Nodes we have already explored.',
    ...componentSlotHighlight('visited'),
  },
} as const satisfies Record<string, ExplainerHighlight>;

export const bfsExplainer =
  (graph: Graph) =>
  (frame: BfsFrame): Explainer | undefined => {
    if (frame.type === 'start') {
      return {
        content: `Adding Starting Node {${frame.node}} to [Queue]`,
        highlights: [highlights.queue],
      };
    }

    if (frame.type === 'end') {
      const visited = frame.visitedNodeIds?.length ?? 0;
      return {
        content: `Done! [Visited] ${visited} Node${visited === 1 ? '' : 's'} Total`,
        highlights: [highlights.visited],
      };
    }

    if (frame.type === 'explore-node') {
      return {
        content: `[Dequeuing] {${frame.exploredNode}} and Exploring It`,
        highlights: [highlights.dequeue],
      };
    }

    if (frame.type === 'mark-visited') {
      return {
        content: `Marking {${frame.node}} as [Visited]`,
        highlights: [highlights.visited],
      };
    }

    if (frame.type === 'travel-edge') {
      const edges = frame.traveledEdgeIds?.map((id) => graph.getEdge(id)) ?? [];
      const nodeTargets = edges.map((edge) => edge.target);
      const nodeTargetsStr = nodeTargets.map((id) => `{${id}}`).join(', ');
      return { content: `Following Edge to ${nodeTargetsStr}` };
    }

    if (frame.type === 'enqueue-node') {
      return {
        content: `{${frame.node}} Is Not In [Visited], Therefore, [Enqueuing]`,
        highlights: [highlights.visited, highlights.enqueue],
      };
    }

    if (frame.type === 'previously-visited') {
      return {
        content: `{${frame.node}} Is In [Visited]. Therefore, We Ignore It`,
        highlights: [highlights.visited],
      };
    }

    if (frame.type === 'dequeued-node-already-visited') {
      return {
        content: `[Dequeuing] and Ignoring {${frame.node}} As It's Already Been [Visited]`,
        highlights: [highlights.dequeue, highlights.visited],
      };
    }
  };
