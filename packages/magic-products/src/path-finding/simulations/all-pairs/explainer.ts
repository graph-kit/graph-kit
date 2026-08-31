import { Explainer, ExplainerHighlight } from '@magic/shared/explainer';
import { Graph, GraphPath } from '@magic/shared/graph';

import { Distance, formatDistance } from '../distance.ts';
import { cost, count } from '../explainerProse.ts';
import { negativeCycle } from '../negativeCycle.ts';
import { matrixSlotId } from './effects.ts';
import { AllPairsFrame } from './frame.ts';

const matrixHighlight = (tooltipLabel: string): ExplainerHighlight => ({
  tooltipLabel,
  activate: ({ shell }) => shell.componentSlots.setHighlighted(matrixSlotId),
  deactivate: ({ shell }) => shell.componentSlots.clearHighlighted(),
});

const highlights = {
  table: matrixHighlight(
    'The cheapest trip between every pair of nodes so far',
  ),
  improve: matrixHighlight('The detour is cheaper, so the cell gets updated'),
  keep: matrixHighlight('The detour is not cheaper so the cell value remains'),
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
          content: 'Seeding the [Table] with the edges in the graph',
          highlights: [highlights.table],
        };

      case 'end':
        if (frame.cycleNodeIds?.length) {
          return {
            content:
              'The [Table] cannot be finalized since a [Negative Cycle] exists',
            highlights: [
              highlights.table,
              negativeCycle(graph, frame.cycleEdgeIds),
            ],
          };
        }

        return {
          content:
            'Done! The [Table] shows the cheapest path between each pair of nodes',
          highlights: [highlights.table],
        };

      case 'choose-pivot':
        return {
          content: `Phase ${frame.pivotNumber} of ${frame.totalPivots}: Can routing via {${frame.node}} reduce the current [Table] value?`,
          highlights: [highlights.table],
        };

      case 'consider-pair': {
        const detourCost = cost(graph, frame.detourDistance, frame.detourRoute);
        const currentCost = cellCost(
          graph,
          frame.currentDistance,
          frame.currentRoute,
        );

        return {
          content: `{${frame.from}} via {${frame.pivot}} to {${frame.to}} costs ${detourCost.text} compared with a current cost of ${currentCost.text}`,
          highlights: [...detourCost.highlights, ...currentCost.highlights],
        };
      }

      case 'keep-pair': {
        const keptCost = cost(graph, frame.currentDistance, frame.currentRoute);
        const detourCost = cost(graph, frame.detourDistance, frame.detourRoute);

        return {
          content: `{${frame.from}} to {${frame.to}} currently costs ${keptCost.text} which is not less than the current route via {${frame.pivot}} costing ${detourCost.text} so the current cost [Remains]`,
          highlights: [
            ...keptCost.highlights,
            ...detourCost.highlights,
            highlights.keep,
          ],
        };
      }

      case 'improve-pair': {
        const improved = cost(graph, frame.detourDistance, frame.detourRoute);

        if (frame.previousDistance === undefined) {
          return {
            content: `Nothing has linked {${frame.from}} to {${frame.to}} yet, so the cost [Improves] from ∞ to ${improved.text}`,
            highlights: [highlights.improve, ...improved.highlights],
          };
        }

        const previousCost = cost(
          graph,
          frame.previousDistance,
          frame.previousRoute,
        );

        return {
          content: `The detour improves against ${previousCost.text}, so the cost for {${frame.from}} to {${frame.to}} [Improves] to ${improved.text}`,
          highlights: [
            ...previousCost.highlights,
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
        const found = `{${frame.node}} can return to itself for less than nothing`;

        if (!frame.loop) {
          return {
            content: `${found}, so a [Negative Cycle] runs through it and no shortest path exists`,
            highlights: [negativeCycle(graph)],
          };
        }

        const lap = cost(graph, frame.loop.lapCost, frame.loop.edges);

        return {
          content: `${found}: a [Negative Cycle] costing ${lap.text} a lap, so no shortest path exists`,
          highlights: [
            negativeCycle(graph, frame.loop.edges),
            ...lap.highlights,
          ],
        };
      }
    }
  };
