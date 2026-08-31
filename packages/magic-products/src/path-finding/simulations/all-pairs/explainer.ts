import { Explainer, ExplainerHighlight } from '@magic/shared/explainer';
import { Graph, GraphPath } from '@magic/shared/graph';

import { Distance, formatDistance } from '../distance.ts';
import { negativeCycle } from '../negativeCycle.ts';
import { matrixSlotId } from './effects.ts';
import { cost, count } from './explainerParts.ts';
import { AllPairsFrame } from './frame.ts';

const matrixHighlight = (tooltipLabel: string): ExplainerHighlight => ({
  tooltipLabel,
  activate: ({ shell }) => shell.componentSlots.setHighlighted(matrixSlotId),
  deactivate: ({ shell }) => shell.componentSlots.clearHighlighted(),
});

const highlights = {
  table: matrixHighlight(
    'The cheapest trip we know between every pair of nodes',
  ),
  improve: matrixHighlight('The detour is cheaper, so the cell gets rewritten'),
  keep: matrixHighlight(
    'The detour is no cheaper than the trip already in the cell, so the cell is left alone',
  ),
} as const satisfies Record<string, ExplainerHighlight>;

const cellCost = (graph: Graph, distance: Distance, route: GraphPath) =>
  distance === undefined
    ? { text: formatDistance(distance), highlights: [] as ExplainerHighlight[] }
    : cost(graph, distance, route);

export const allPairsExplainer =
  (graph: Graph) =>
  (frame: AllPairsFrame): Explainer | undefined => {
    switch (frame.type) {
      case 'start':
        return {
          content: 'Seeding the [Table] with the Edges We Already Have',
          highlights: [highlights.table],
        };

      case 'end':
        if (frame.cycleNodeIds?.length) {
          return {
            content:
              'The [Table] Cannot Be Finalized. While a [Negative Cycle] Exists, Every Trip Through It Can Still Get Cheaper',
            highlights: [
              highlights.table,
              negativeCycle(graph, frame.cycleEdgeIds),
            ],
          };
        }

        return {
          content: "Done! Every Pair's Shortest Trip Is in the [Table]",
          highlights: [highlights.table],
        };

      case 'choose-pivot':
        return {
          content: `Pivot ${frame.pivotNumber} of ${frame.totalPivots}: Can Detouring Through {${frame.node}} Beat the [Table]?`,
          highlights: [highlights.table],
        };

      case 'consider-pair': {
        const detour = cost(graph, frame.detourDistance, frame.detourRoute);
        const today = cellCost(
          graph,
          frame.currentDistance,
          frame.currentRoute,
        );

        return {
          content: `{${frame.from}} to {${frame.to}} via {${frame.pivot}} Costs ${detour.text}, Against ${today.text} Today`,
          highlights: [...detour.highlights, ...today.highlights],
        };
      }

      case 'keep-pair': {
        const kept = cost(graph, frame.currentDistance, frame.currentRoute);
        const detour = cost(graph, frame.detourDistance, frame.detourRoute);

        return {
          content: `{${frame.from}} to {${frame.to}} Is Already ${kept.text}, So the Detour Through {${frame.pivot}} Costing ${detour.text} Is No Help and the Cell [Remains]`,
          highlights: [
            ...kept.highlights,
            ...detour.highlights,
            highlights.keep,
          ],
        };
      }

      case 'improve-pair': {
        const improved = cost(graph, frame.detourDistance, frame.detourRoute);

        if (frame.previousDistance === undefined) {
          return {
            content: `Nothing Has Linked {${frame.from}} to {${frame.to}} Before, So the Cell [Improves] From ∞ to ${improved.text}`,
            highlights: [highlights.improve, ...improved.highlights],
          };
        }

        const beaten = cost(graph, frame.previousDistance, frame.previousRoute);

        return {
          content: `The Detour Wins Against ${beaten.text}, So the Cell for {${frame.from}} to {${frame.to}} [Improves] to ${improved.text}`,
          highlights: [
            ...beaten.highlights,
            highlights.improve,
            ...improved.highlights,
          ],
        };
      }

      case 'unreachable':
        return {
          content: `${count(frame.pairs, 'pair')} out of ${frame.totalPairs} stayed at ∞, since no route joins ${frame.pairs === 1 ? 'it' : 'them'} at all`,
          highlights: [],
        };

      case 'negative-cycle': {
        const found = `{${frame.node}} Can Return to Itself for Less Than Nothing`;

        if (!frame.loop) {
          return {
            content: `${found}, So a [Negative Cycle] Runs Through It and No Shortest Path Exists`,
            highlights: [negativeCycle(graph)],
          };
        }

        const lap = cost(graph, frame.loop.lapCost, frame.loop.edges);

        return {
          content: `${found}: a [Negative Cycle] Costing ${lap.text} a Lap, So No Shortest Path Exists`,
          highlights: [
            negativeCycle(graph, frame.loop.edges),
            ...lap.highlights,
          ],
        };
      }
    }
  };
