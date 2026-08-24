import { Explainer, ExplainerHighlight } from '@magic/shared/explainer';
import { Graph } from '@magic/shared/graph';

import { explainerDistance } from '../distance.ts';
import { SingleSourceFrame } from './frame.ts';

export const distancesSlotId = 'path-finding/distances';
export const frontierSlotId = 'path-finding/frontier';

const componentSlotHighlight = (
  slot: typeof frontierSlotId | typeof distancesSlotId,
): ExplainerHighlight => ({
  activate: ({ shell }) => shell.componentSlots.setHighlighted(slot),
  deactivate: ({ shell }) => shell.componentSlots.clearHighlighted(),
});

const highlights = {
  distances: {
    tooltipLabel: 'The cheapest trip we know to each node so far',
    ...componentSlotHighlight(distancesSlotId),
  },
  improve: {
    tooltipLabel: 'A cheaper way in! Write the new distance down',
    ...componentSlotHighlight(distancesSlotId),
  },
  keep: {
    tooltipLabel: 'The trip we already had is no worse, so nothing changes',
    ...componentSlotHighlight(distancesSlotId),
  },
  frontier: {
    tooltipLabel: 'Everything discovered but not yet finalized, cheapest first',
    ...componentSlotHighlight(frontierSlotId),
  },
} as const satisfies Record<string, ExplainerHighlight>;

export const singleSourceExplainer =
  (graph: Graph) =>
  (frame: SingleSourceFrame): Explainer | undefined => {
    if (frame.type === 'start') {
      return {
        content: `Starting at {${frame.source}}. Every Other Node Is an ∞ Away in [Distances]`,
        highlights: [highlights.distances],
      };
    }

    if (frame.type === 'end') {
      return {
        content: `Done! The [Distances] from {${frame.anchorNodeId}} Are as Short as They Get`,
        highlights: [highlights.distances],
      };
    }

    if (frame.type === 'settle-node') {
      return {
        content: `Cheapest in the [Frontier] is {${frame.node}} at ${explainerDistance(frame.distance)}, So That Distance Is Final`,
        highlights: [highlights.frontier],
      };
    }

    if (frame.type === 'relax-edge') {
      const { weight } = graph.getEdge(frame.edge);
      return {
        content: `Taking the Edge from {${frame.from}} to {${frame.to}}, Which Costs <${weight}>`,
      };
    }

    if (frame.type === 'improve-distance') {
      return {
        content: `${explainerDistance(frame.newDistance)} Beats ${explainerDistance(frame.oldDistance)}, So [Improving] {${frame.node}}`,
        highlights: [highlights.improve],
      };
    }

    if (frame.type === 'keep-distance') {
      return {
        content: `{${frame.node}} Is Already ${explainerDistance(frame.distance)} Away and ${explainerDistance(frame.offered)} Is No Better, So [Keeping] It`,
        highlights: [highlights.keep],
      };
    }

    if (frame.type === 'unreachable') {
      const count = frame.nodes.length;
      return {
        content: `${count} Node${count === 1 ? '' : 's'} Stayed at ∞ in [Distances]: Nothing Leads There`,
        highlights: [highlights.distances],
      };
    }

    if (frame.type === 'begin-pass') {
      return {
        content: `Pass ${frame.pass} of ${frame.totalPasses}: Sweeping Every Edge Once More`,
      };
    }

    if (frame.type === 'pass-settled') {
      return {
        content: `Pass ${frame.pass} Changed Nothing, So No Later Pass Will Either. [Distances] Are Final`,
        highlights: [highlights.distances],
      };
    }

    if (frame.type === 'negative-cycle') {
      return {
        content: `{${frame.node}} Can Still Get Cheaper! A Negative Cycle Means No Shortest Path Exists`,
      };
    }
  };
