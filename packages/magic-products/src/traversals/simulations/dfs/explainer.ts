import { Explainer, ExplainerHighlight } from '@magic/shared/explainer';
import { Graph } from '@magic/shared/graph';

import { DfsFrame } from './frame.ts';
import { slotIds } from './lens.ts';

const componentSlotHighlight = (
  slot: keyof typeof slotIds,
): ExplainerHighlight => ({
  activate: ({ shell }) => shell.componentSlots.setHighlighted(slotIds[slot]),
  deactivate: ({ shell }) => shell.componentSlots.clearHighlighted(),
});

/*
  deliberately the queue explainer with one word swapped, because the swap is
  the whole lesson: same walk, same bookkeeping, and the only thing that makes
  it depth first is taking off the top instead of off the front
*/
const highlights = {
  stack: {
    tooltipLabel: 'The pile. Last one on is the first one off',
    ...componentSlotHighlight('stack'),
  },
  push: {
    tooltipLabel: 'Drop it on top of the stack!',
    ...componentSlotHighlight('stack'),
  },
  pop: {
    tooltipLabel: 'Grab whoever is on top of the stack',
    ...componentSlotHighlight('stack'),
  },
  visited: {
    tooltipLabel: 'Nodes we have already seen, nothing new here',
    ...componentSlotHighlight('visited'),
  },
} as const satisfies Record<string, ExplainerHighlight>;

export const dfsExplainer =
  (graph: Graph) =>
  (frame: DfsFrame): Explainer | undefined => {
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
        content: `[Popping] and Exploring {${frame.exploredNode}}`,
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
      const edges = frame.traveledEdgeIds?.map((id) => graph.getEdge(id)) ?? [];
      const nodeTargets = edges.map((edge) => edge.target);
      const nodeTargetsStr = nodeTargets.map((id) => `{${id}}`).join(', ');
      return { content: `Following Edge to ${nodeTargetsStr}` };
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
        content: `It Seems {${frame.node}} Has Been [Visited] Since Being Added to [Stack]! Let's Ignore It`,
        highlights: [highlights.visited, highlights.stack],
      };
    }
  };
