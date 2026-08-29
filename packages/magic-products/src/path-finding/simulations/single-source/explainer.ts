import { Explainer, ExplainerHighlight } from '@magic/shared/explainer';
import { Graph } from '@magic/shared/graph';

import { formatDistance } from '../distance.ts';
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
        content: `Starting at {${frame.source}}. Every Other Node Is an <∞> Away in [Distances]`,
        highlights: [highlights.distances],
      };
    }

    if (frame.type === 'end') {
      return {
        content: `Done! The [Distances] from {${frame.anchorNodeId}} Are as Short as They Get`,
        highlights: [highlights.distances],
      };
    }

    if (frame.type === 'safe-to-settle') {
      const here = formatDistance(frame.distance);

      const mustPass = `Every Other Route to {${frame.node}} Has to Leave Through the [Frontier].`;

      const waiting =
        frame.runnerUp === undefined
          ? 'Nothing Else Is Waiting There.'
          : `The Cheapest Thing Waiting There Is {${frame.runnerUp.node}} at <${formatDistance(frame.runnerUp.distance)}>.`;

      const conclusion = frame.allWeightsNonNegative
        ? `And No Edge Costs Less Than <0>. So Nothing Can Reach {${frame.node}} for Less Than <${here}>`
        : `But an Edge Here Costs Less Than <0>, So a Later Route Could Still Reach {${frame.node}} for Less Than <${here}>`;

      return {
        content: `${mustPass} ${waiting} ${conclusion}`,
        highlights: [highlights.frontier],
      };
    }

    if (frame.type === 'settle-node') {
      if (frame.node === frame.anchorNodeId) {
        return {
          content: `{${frame.node}} Is Where We Started, So <${formatDistance(frame.distance)}> Is Already as Short as It Gets`,
        };
      }

      if (!frame.allWeightsNonNegative) {
        return {
          content: `Dijkstra Calls {${frame.node}} Final at <${formatDistance(frame.distance)}> Anyway, Because That Is What It Does`,
        };
      }

      return {
        content: `So {${frame.node}} Is Final at <${formatDistance(frame.distance)}>`,
      };
    }

    if (frame.type === 'still-tentative') {
      const named = frame.waiting.map(
        ({ node, distance }) => `{${node}} at <${formatDistance(distance)}>`,
      );

      if (named.length === 1) {
        return {
          content: `${named[0]} Is Still Waiting. A Route Through {${frame.via}} Could Still Reach It for Less, So It Is Not Final Yet`,
        };
      }

      const list =
        named.length === 2
          ? `${named[0]} and ${named[1]}`
          : `${named.slice(0, -1).join(', ')}, and ${named[named.length - 1]}`;

      return {
        content: `${list} Are Still Waiting. A Route Through {${frame.via}} Could Still Reach Any of Them for Less, So None of Them Is Final Yet`,
      };
    }

    if (frame.type === 'explore-node') {
      if (frame.edgeCount === 0) {
        return {
          content: `Nothing Leaves {${frame.node}}, So There Is Nothing to Check`,
        };
      }

      const edges =
        frame.edgeCount === 1
          ? `the Single Edge Leaving {${frame.node}}`
          : `Each of the ${frame.edgeCount} Edges Leaving {${frame.node}}`;

      return {
        content: `Now Follow ${edges}, and See Whether Going Through It at <${formatDistance(frame.distance)}> Beats What We Already Have`,
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
        content: `<${formatDistance(frame.newDistance)}> Beats <${formatDistance(frame.oldDistance)}>, So [Improving] {${frame.node}}`,
        highlights: [highlights.improve],
      };
    }

    if (frame.type === 'keep-distance') {
      return {
        content: `{${frame.node}} Is Already <${formatDistance(frame.distance)}> Away and <${formatDistance(frame.offered)}> Is No Better, So [Keeping] It`,
        highlights: [highlights.keep],
      };
    }

    if (frame.type === 'unreachable') {
      const count = frame.nodes.length;
      return {
        content: `${count} Node${count === 1 ? '' : 's'} Stayed at <∞> in [Distances]: Nothing Leads There`,
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
