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
  the copy never names a stack or a call frame, because neither is what makes
  this depth first. the only rule that matters is which node we pick up next:
  the one we found most recently, which is what keeps us walking away from the
  start instead of fanning out around it
*/
const highlights = {
  frontier: {
    tooltipLabel: 'Everything we have found but not explored yet',
    ...componentSlotHighlight('frontier'),
  },
  discover: {
    tooltipLabel: 'Just found, so it goes ahead of everything already waiting',
    ...componentSlotHighlight('frontier'),
  },
  takeNewest: {
    tooltipLabel: 'Take what we found most recently, not what we found first',
    ...componentSlotHighlight('frontier'),
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
        content: `Adding Starting Node {${frame.node}} to the [Frontier]`,
        highlights: [highlights.frontier],
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
        content: `Taking {${frame.exploredNode}}, Our [Newest Find], and Exploring It`,
        highlights: [highlights.takeNewest],
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

    if (frame.type === 'discover-node') {
      return {
        content: `{${frame.node}} Not In [Visited], Therefore, It [Cuts the Line]`,
        highlights: [highlights.visited, highlights.discover],
      };
    }

    if (frame.type === 'previously-visited') {
      return {
        content: `{${frame.node}} Is In [Visited]. Therefore, We Ignore It`,
        highlights: [highlights.visited],
      };
    }

    if (frame.type === 'taken-node-already-visited') {
      return {
        content: `It Seems {${frame.node}} Has Been [Visited] Since Joining the [Frontier]! Let's Ignore It`,
        highlights: [highlights.visited, highlights.frontier],
      };
    }
  };
