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
          content: 'Seeding The [Table] With The Edges In The Graph',
          highlights: [highlights.table],
        };

      case 'end':
        if (frame.cycleNodeIds?.length) {
          return {
            content:
              'The [Table] Cannot Be Finalized Since A [Negative Cycle] Exists',
            highlights: [
              highlights.table,
              negativeCycle(graph, frame.cycleEdgeIds),
            ],
          };
        }

        return {
          content:
            'Done! The [Table] Shows The Cheapest Path Between Each Pair Of Nodes',
          highlights: [highlights.table],
        };

      case 'choose-pivot':
        return {
          content: `Phase ${frame.pivotNumber} Of ${frame.totalPivots}: Can Routing Via {${frame.node}} Reduce The Current [Table] Value?`,
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
          content: `{${frame.from}} Via {${frame.pivot}} To {${frame.to}} Costs ${detourCost.text} Compared With A Current Cost Of ${currentCost.text}`,
          highlights: [...detourCost.highlights, ...currentCost.highlights],
        };
      }

      case 'keep-pair': {
        const keptCost = cost(graph, frame.currentDistance, frame.currentRoute);
        const detourCost = cost(graph, frame.detourDistance, frame.detourRoute);

        return {
          content: `The New Route Via {${frame.pivot}} Costs ${detourCost.text} Which Is Not Less Than The Current Route {${frame.from}} To {${frame.to}} Costing ${keptCost.text} So The Current Cost [Remains]`,
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
            content: `Nothing Has Linked {${frame.from}} To {${frame.to}} Yet, So The Cost [Improves] From ∞ To ${improved.text}`,
            highlights: [highlights.improve, ...improved.highlights],
          };
        }

        const previousCost = cost(
          graph,
          frame.previousDistance,
          frame.previousRoute,
        );

        return {
          content: `The Detour Costs Less Than ${previousCost.text}, So The Cost For {${frame.from}} To {${frame.to}} [Improves] To ${improved.text}`,
          highlights: [
            ...previousCost.highlights,
            highlights.improve,
            ...improved.highlights,
          ],
        };
      }

      case 'unreachable':
        return {
          content: `${count(frame.pairs, 'Pair')} Out Of ${frame.totalPairs} Stayed At ∞, Since No Route Joins ${frame.pairs === 1 ? 'It' : 'Them'} At All`,
          highlights: [],
        };

      case 'negative-cycle': {
        // the same finding either way, so tracing the loop only adds what a lap costs
        const found = `{${frame.node}} Can Return To Itself For Less Than 0, So A [Negative Cycle] Runs Through It And No Shortest Path Exists`;

        if (!frame.loop) {
          return {
            content: found,
            highlights: [negativeCycle(graph)],
          };
        }

        const lap = cost(graph, frame.loop.lapCost, frame.loop.edges);

        return {
          content: `${found}. Each Lap Costs ${lap.text}`,
          highlights: [
            negativeCycle(graph, frame.loop.edges),
            ...lap.highlights,
          ],
        };
      }
    }
  };
