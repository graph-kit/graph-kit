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

const passHighlight = (
  nodeCount: number,
  totalPasses: number,
): ExplainerHighlight => ({
  tooltipLabel: `A pass sweeps every edge once. A cheapest path never repeats a node, so a cheapest path on a graph containing ${count(nodeCount, 'node')} uses at most ${count(totalPasses, 'edge')}. To confirm the cheapest path, we need at most ${count(totalPasses, 'pass', 'passes')}`,
});

export const singleSourceExplainer =
  (graph: Graph) =>
  (frame: SingleSourceFrame): Explainer | undefined => {
    switch (frame.type) {
      case 'start':
        return {
          content: `Starting At {${frame.source}}. Every Other [Distance] Starts At ∞`,
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
        const settling = cost(graph, frame.distance, frame.path);

        if (frame.runnerUp === undefined) {
          return {
            content: `{${frame.node}} Is The Only Node Left On The [Frontier], So No Other Paths Can Be Cheaper Than ${settling.text}`,
            highlights: [highlights.frontier, ...settling.highlights],
          };
        }

        const runnerUp = cost(
          graph,
          frame.runnerUp.distance,
          frame.runnerUp.path,
        );

        return {
          content: `{${frame.node}} Is The Cheapest Node On The [Frontier] At ${settling.text}. Any Other Path To It Would Cost At Least ${runnerUp.text} Through {${frame.runnerUp.node}}`,
          // one per [Frontier] mention, then one per cost, in the order said
          highlights: [
            highlights.frontier,
            ...settling.highlights,
            ...runnerUp.highlights,
          ],
        };
      }

      case 'settle-node': {
        const settled = cost(graph, frame.distance, frame.path);

        return {
          content: `{${frame.node}} Is Now [Finalized] At ${settled.text}`,
          highlights: [highlights.finalized, ...settled.highlights],
        };
      }

      case 'still-tentative': {
        const via = cost(graph, frame.via.distance, frame.via.path);

        const waiting = listOf(frame.waiting.map(({ node }) => `{${node}}`));
        const many = frame.waiting.length > 1;

        return {
          content: `${waiting} ${many ? 'Cost' : 'Costs'} More Than ${via.text}, So A Path Through {${frame.via.node}} Could Still Reach ${many ? 'Them' : 'It'} For Less Than ${many ? 'Their' : 'Its'} Current Cost. ${many ? 'They Are' : 'It Is'} Not Yet [Finalized]`,
          highlights: [...via.highlights, highlights.finalized],
        };
      }

      case 'explore-node': {
        if (frame.edges.length === 0) {
          return {
            content: `{${frame.node}} Has No Outbound Edges, So No Path Can Continue Through It`,
          };
        }

        const follow = `{${frame.node}} Has [${count(frame.edges.length, 'Edge')}] Leading To Nodes That Are Not Finalized`;

        const followHighlights = [createEdgeSetHighlight(graph, frame.edges)];

        //  only for the start node we dont ask how going through "0 cost" will improve the cost of other nodes
        if (frame.node === frame.anchorNodeId) {
          return {
            content: `${follow}`,
            highlights: followHighlights,
          };
        }

        const initial = cost(graph, frame.distance, frame.basePath);

        return {
          content: `${follow}. Every Path Out Of {${frame.node}} Starts At An Initial Cost Of ${initial.text}`,
          highlights: [...followHighlights, ...initial.highlights],
        };
      }

      case 'relax-edge': {
        return {
          content: `Pathing Through {${frame.edge}} Costs <${graph.getEdge(frame.edge).weight}>`,
        };
      }

      case 'improve-distance': {
        const improved = cost(graph, frame.newDistance, frame.newPath);

        if (frame.oldDistance === undefined) {
          return {
            content: `Nothing Has Reached {${frame.node}} Yet, So Its Distance [Improves] From ∞ To ${improved.text}`,
            highlights: [highlights.improve, ...improved.highlights],
          };
        }

        const had = cost(graph, frame.oldDistance, frame.oldPath);

        return {
          content: `{${frame.node}} Currently Costs ${had.text}. Going Through {${frame.via}} Costs ${improved.text}. Its Distance [Improves]`,
          highlights: [
            ...had.highlights,
            ...improved.highlights,
            highlights.improve,
          ],
        };
      }

      case 'keep-distance': {
        if (frame.offeredPath.length === 0) {
          return {
            content: `{${frame.edge}} Doubles Back To {${frame.node}}, Adding Cost For No Progress, So Its Cost [Remains]`,
            highlights: [highlights.keep],
          };
        }

        const offered = cost(graph, frame.offered, frame.offeredPath);
        const current = cost(graph, frame.distance, frame.currentPath);

        return {
          content: `${offered.text} Does Not Decrease The Cost Of Reaching {${frame.node}} Which Currently Costs ${current.text}. The Current Cost [Remains]`,
          highlights: [
            ...offered.highlights,
            ...current.highlights,
            highlights.keep,
          ],
        };
      }

      case 'unreachable': {
        const singular = frame.nodes.length === 1;
        return {
          content: `${count(frame.nodes.length, 'Node')} Kept A [Distance] Of ∞ Because No Path From {${frame.anchorNodeId}} Reaches ${singular ? 'It' : 'Them'}`,
          highlights: [highlights.distances],
        };
      }

      // bellman-ford only

      case 'begin-pass': {
        const pass = passHighlight(frame.nodeCount, frame.totalPasses);

        if (frame.pass === 1) {
          return {
            content: `[Pass] 1 Of ${frame.totalPasses}. Sweeping Edges In [Order]`,
            highlights: [pass, highlights.sweep],
          };
        }

        return {
          content: `[Pass] ${frame.pass} Of ${frame.totalPasses} Settles Every Cheapest Path Of ${count(frame.pass, 'Edge')}. Sweeping Edges In [Order]`,
          highlights: [pass, highlights.sweep],
        };
      }

      case 'skip-unreachable':
        return {
          content: `{${frame.edge}} Is Swept, But {${frame.from}} Still Costs ∞, So {${frame.to}} Cannot Be Updated`,
        };

      case 'pass-settled': {
        const settled = `Pass ${frame.pass} Did Not Improve Any Costs Meaning The [Distances] Are Final`;
        const remaining = frame.totalPasses - frame.pass;

        if (remaining === 0) {
          return { content: settled, highlights: [highlights.distances] };
        }

        const skipped =
          remaining === 1
            ? `Pass ${frame.totalPasses} Is Not Needed`
            : `Passes ${frame.pass + 1} To ${frame.totalPasses} Are Not Needed`;

        return {
          content: `${settled}. ${skipped}`,
          highlights: [highlights.distances],
        };
      }

      case 'begin-verification': {
        return {
          content: `After ${count(frame.passesDone, 'Pass', 'Passes')} The [Distances] Should Be Final. One More Sweep Checks For A [Negative Cycle]`,
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
            content: `${stillImproves}. The [Negative Cycle] Check Fails Because Every Pass Lowers The Cost. No Cheapest Paths Are Possible`,
            highlights: [negativeCycle(graph)],
          };
        }

        const lap = cost(graph, frame.loop.lapCost, frame.loop.edges);

        return {
          content: `${stillImproves}. The [Negative Cycle] Check Fails So Every Pass Lowers The Cost. The Cycle Costs ${lap.text}. No Cheapest Paths Are Possible`,
          highlights: [
            negativeCycle(graph, frame.loop.edges),
            ...lap.highlights,
          ],
        };
      }
    }
  };
