import { Explainer, ExplainerHighlight } from '@magic/shared/explainer';

import { DfsFrame } from './frame.ts';
import { slotIds } from './lens.ts';

const componentSlotHighlight = (
  slot: keyof typeof slotIds,
): ExplainerHighlight => ({
  activate: ({ shell }) => shell.componentSlots.setHighlighted(slotIds[slot]),
  deactivate: ({ shell }) => shell.componentSlots.clearHighlighted(),
});

const highlights = {
  stack: {
    tooltipLabel:
      'A LIFO data structure. The last node on is the first node to come off.',
    ...componentSlotHighlight('stack'),
  },
  push: {
    tooltipLabel: 'Push adds a node to the top of the stack.',
    ...componentSlotHighlight('stack'),
  },
  pop: {
    tooltipLabel: 'Pop removes the top node in the stack.',
    ...componentSlotHighlight('stack'),
  },
  visited: {
    tooltipLabel: 'Nodes we have already explored.',
    ...componentSlotHighlight('visited'),
  },
} as const satisfies Record<string, ExplainerHighlight>;

export const dfsExplainer = (frame: DfsFrame): Explainer | undefined => {
  if (frame.type === 'start') {
    return {
      content: `Adding Starting Node {${frame.node}} to [Stack]`,
      highlights: [highlights.stack],
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
      content: `[Popping] {${frame.exploredNode}} and Exploring It`,
      highlights: [highlights.pop],
    };
  }

  if (frame.type === 'mark-visited') {
    return {
      content: `Marking {${frame.node}} as [Visited]`,
      highlights: [highlights.visited],
    };
  }

  if (frame.type === 'travel-edge') {
    return { content: `Exploring {${frame.node}}'s Neighbors` };
  }

  if (frame.type === 'push-node') {
    return {
      content: `{${frame.node}} Not In [Visited], Therefore, [Pushing]`,
      highlights: [highlights.visited, highlights.push],
    };
  }

  if (frame.type === 'previously-visited') {
    return {
      content: `{${frame.node}} Is In [Visited]. Therefore, We Ignore It`,
      highlights: [highlights.visited],
    };
  }

  if (frame.type === 'popped-node-already-visited') {
    return {
      content: `[Popping] and Ignoring {${frame.node}} As It's Already Been [Visited]`,
      highlights: [highlights.pop, highlights.visited],
    };
  }
};
