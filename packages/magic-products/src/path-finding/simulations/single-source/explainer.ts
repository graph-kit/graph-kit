import { Explainer, ExplainerHighlight } from '@magic/shared/explainer';
import { Graph } from '@magic/shared/graph';

import { createEdgeSetHighlight } from '../createEdgeSetHighlight.ts';
import { cost, count, listOf } from '../explainerProse.ts';
import { negativeCycle } from '../negativeCycle.ts';
import { SingleSourceFrame } from './frame.ts';

export const distancesSlotId = 'path-finding/distances';
export const frontierSlotId = 'path-finding/frontier';
export const sweepSlotId = 'path-finding/sweep';

export const finalizedSlotId = 'path-finding/finalized';

type SlotId =
  | typeof distancesSlotId
  | typeof frontierSlotId
  | typeof sweepSlotId
  | typeof finalizedSlotId;

const slotHighlight = (
  slot: SlotId,
  tooltipLabel: string,
): ExplainerHighlight => ({
  tooltipLabel,
  activate: ({ shell }) => shell.componentSlots.setHighlighted(slot),
  deactivate: ({ shell }) => shell.componentSlots.clearHighlighted(),
});

const highlights = {
  distances: slotHighlight(
    distancesSlotId,
    'The cheapest path from the start node',
  ),
  finalized: slotHighlight(
    finalizedSlotId,
    'This node is as cheap as it can get. No other path can reduce its cost',
  ),
  improve: slotHighlight(
    distancesSlotId,
    'The distance we just found is cheaper than what we had before, so we update the distance',
  ),
  keep: slotHighlight(
    distancesSlotId,
    'The distance we just found is not cheaper than what we had before, so we keep the distance we already had',
  ),
  frontier: slotHighlight(
    frontierSlotId,
    'All nodes that have been explored but not finalized yet. The distances may be improved with a different path.',
  ),
  sweep: slotHighlight(
    sweepSlotId,
    'Every edge in the graph, in the order this pass visits them',
  ),
} as const satisfies Record<string, ExplainerHighlight>;

export const singleSourceExplainer =
  (graph: Graph) =>
  (frame: SingleSourceFrame): Explainer | undefined => {
    switch (frame.type) {
      case 'start':
        return {
          content: `Starting At {${frame.source}}. Every Other Node Starts At A [Distance] Of ∞`,
          highlights: [highlights.distances],
        };

      case 'end':
        if (frame.cycleEdgeIds?.length) {
          return {
            content: `Cannot Finalize [Distances] While A [Negative Cycle] Exists, We Cannot Find The Cheapest Path From {${frame.anchorNodeId}}`,
            highlights: [
              highlights.distances,
              negativeCycle(graph, frame.cycleEdgeIds),
            ],
          };
        }

        return {
          content: `Done! The [Distances] From {${frame.anchorNodeId}} Are As Cheap As They Can Get`,
          highlights: [highlights.distances],
        };

      case 'safe-to-settle': {
        const mustPass = `Every New Path To {${frame.node}} Must Leave Through The [Frontier].`;

        if (frame.runnerUp === undefined) {
          return {
            content: `${mustPass} There Are No Other Paths To {${frame.node}} That Are Cheaper`,
            highlights: [highlights.frontier],
          };
        }

        const runnerUp = cost(
          graph,
          frame.runnerUp.distance,
          frame.runnerUp.path,
        );
        const settling = cost(graph, frame.distance, frame.path);

        return {
          content: `${mustPass} The Cheapest [Frontier] Node Is {${frame.runnerUp.node}} Costing ${runnerUp.text}. No Path Can Reach {${frame.node}} For Less Than ${settling.text}`,
          // one per [Frontier] mention, then one per cost, in the order said
          highlights: [
            highlights.frontier,
            highlights.frontier,
            ...runnerUp.highlights,
            ...settling.highlights,
          ],
        };
      }

      case 'settle-node': {
        const settled = cost(graph, frame.distance, frame.path);

        return {
          content: `{${frame.node}} Becomes [Finalized] With A Cost Of ${settled.text}`,
          highlights: [highlights.finalized, ...settled.highlights],
        };
      }

      case 'still-tentative': {
        const held = frame.waiting.map((entry) => ({
          node: entry.node,
          shown: cost(graph, entry.distance, entry.path),
        }));
        const via = cost(graph, frame.via.distance, frame.via.path);

        const waiting = [
          listOf(held.map(({ node }) => `{${node}}`)),
          `With Cost${held.length === 1 ? '' : 's'}`,
          listOf(held.map(({ shown }) => shown.text)),
          held.length === 1 ? '' : 'Respectively',
        ]
          .filter(Boolean)
          .join(' ');

        return {
          content: `${waiting} Cannot Yet Be [Finalized]. {${frame.via.node}} Costs ${via.text} To Reach, Which Is Cheaper, So A Path From {${frame.via.node}} Could Be Cheaper`,
          highlights: [
            ...held.flatMap(({ shown }) => shown.highlights),
            highlights.finalized,
            ...via.highlights,
          ],
        };
      }

      case 'explore-node': {
        if (frame.edges.length === 0) {
          return {
            content: `{${frame.node}} Has No Outbound Edges, So Pathing Through It Cannot Improve Any Cost`,
          };
        }

        const follow = `{${frame.node}} Has [${frame.edges.length} Edges] To Un-Finalized Nodes`;

        const followHighlights = [createEdgeSetHighlight(graph, frame.edges)];

        //  only for the start node we dont ask how going through "0 cost" will improve the cost of other nodes
        if (frame.node === frame.anchorNodeId) {
          return {
            content: `${follow}`,
            highlights: followHighlights,
          };
        }

        const edgesReached = listOf(
          frame.edges.map((edge) => `{${graph.getEdge(edge).target}}`),
        );

        const initial = cost(graph, frame.distance, frame.basePath);

        return {
          content: `${follow}. Pathing Through {${frame.node}} With An Initial Cost Of ${initial.text} May Reduce The Current Cost To ${edgesReached}`,
          highlights: [...followHighlights, ...initial.highlights],
        };
      }

      case 'relax-edge':
        return {
          content: `Pathing Through {${frame.edge}} Costs <${graph.getEdge(frame.edge).weight}>`,
        };

      case 'improve-distance': {
        const improved = cost(graph, frame.newDistance, frame.newPath);

        if (frame.oldDistance === undefined) {
          return {
            content: `Nothing Has Reached {${frame.node}} Before, So Its Distance [Improves] From ∞ To ${improved.text}`,
            highlights: [highlights.improve, ...improved.highlights],
          };
        }

        const had = cost(graph, frame.oldDistance, frame.oldPath);

        return {
          content: `{${frame.node}} Currently Costs ${had.text}. Going Through {${frame.via}} Is Cheaper Costing ${improved.text}, So Its Distance [Improves]`,
          highlights: [
            ...had.highlights,
            ...improved.highlights,
            highlights.improve,
          ],
        };
      }

      case 'keep-distance': {
        // no route behind the offer means it doubled back into the very node
        // it was headed for, so there is no trip to put a cost against
        if (frame.offeredPath.length === 0) {
          return {
            content: `Following {${frame.edge}} Would Visit {${frame.node}} Twice, Adding Cost For No Progress. The Current Cost [Remains]`,
            highlights: [highlights.keep],
          };
        }

        const offered = cost(graph, frame.offered, frame.offeredPath);
        const current = cost(graph, frame.distance, frame.currentPath);

        return {
          content: `${offered.text} Does Not Decrease The Cost Of Reaching {${frame.node}} Which Currently Costs ${current.text}. Therefore The Current Cost [Remains]`,
          highlights: [
            ...offered.highlights,
            ...current.highlights,
            highlights.keep,
          ],
        };
      }

      case 'unreachable': {
        const nodesCount = frame.nodes.length;
        const singular = nodesCount === 1;
        return {
          content: `${nodesCount} Node${singular ? '' : 's'} Stayed At A [Distance] Of ∞ Since No Edges Lead To ${singular ? 'It' : 'Them'}`,
          highlights: [highlights.distances],
        };
      }

      // bellman-ford only

      case 'begin-pass': {
        return {
          content: `Pass ${frame.pass} Of ${frame.totalPasses}. The Cheapest Path Uses At Most ${count(frame.pass, 'Edge')}. Sweeping Edges In [Order]`,
          highlights: [highlights.sweep],
        };
      }

      case 'skip-unreachable':
        return {
          content: `{${frame.edge}} Is Swept, But {${frame.from}} Still Costs ∞, So {${frame.to}} Cannot Be Updated`,
        };

      case 'pass-settled':
        return {
          content: `Pass ${frame.pass} Did Not Improve Any Costs Meaning The [Distances] Are Final`,
          highlights: [highlights.distances],
        };

      case 'begin-verification': {
        return {
          content: `After ${count(frame.passesDone, 'Pass', 'Passes')} All [Distances] Are Final. A Verification Sweep Will Confirm There Are No [Negative Cycles]`,
          highlights: [highlights.distances, negativeCycle(graph)],
        };
      }

      case 'verify-edge': {
        const held = cost(graph, frame.current, frame.currentPath);

        return {
          content: `{${frame.edge}} Does Not Lower The Cost To {${frame.to}} Which Costs ${held.text}`,
          highlights: held.highlights,
        };
      }

      case 'no-negative-cycle':
        return {
          content: `The Sweep Improved Nothing, So [Distances] Are Final`,
          highlights: [highlights.distances],
        };

      case 'negative-cycle': {
        const stillImproves = `{${frame.edge}} Lowers The Cost To {${frame.node}}`;

        if (!frame.loop) {
          return {
            content: `${stillImproves}. The [Negative Cycle] Check Fails So The Algorithm Cannot Give A Cheapest Path`,
            highlights: [negativeCycle(graph)],
          };
        }

        const lap = cost(graph, frame.loop.lapCost, frame.loop.edges);

        return {
          content: `${stillImproves}. The [Negative Cycle] Check Fails So The Algorithm Cannot Give A Cheapest Path. The Cycle Costs ${lap.text}`,
          highlights: [
            negativeCycle(graph, frame.loop.edges),
            ...lap.highlights,
          ],
        };
      }
    }
  };
