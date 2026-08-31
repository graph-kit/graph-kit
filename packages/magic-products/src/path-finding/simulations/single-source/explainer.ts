import { displayNumber } from '@core/utils/math';
import {
  Explainer,
  ExplainerHighlight,
  createEdgeSetHighlight,
} from '@magic/shared/explainer';
import { GEdge, Graph } from '@magic/shared/graph';
import Fraction from 'fraction.js';

import { SingleSourceFrame } from './frame.ts';

export const distancesSlotId = 'path-finding/distances';
export const frontierSlotId = 'path-finding/frontier';
export const sweepSlotId = 'path-finding/sweep';
export const negativeCycleSlotId = 'path-finding/negativeCycle';

type SlotId =
  | typeof distancesSlotId
  | typeof frontierSlotId
  | typeof sweepSlotId
  | typeof negativeCycleSlotId;

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
    'The cheapest distance to the node so far',
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
  negativeCycle: slotHighlight(
    negativeCycleSlotId,
    'A cycle in which all edges sum to a negative value',
  ),
} as const satisfies Record<string, ExplainerHighlight>;

const cost = (graph: Graph, value: Fraction, path: readonly GEdge['id'][]) => {
  const { primary, secondary } = displayNumber(value);

  if (path.length === 0) {
    return { text: `<${primary}>`, highlights: [] as ExplainerHighlight[] };
  }

  return {
    text: `[${primary}]`,
    highlights: [createEdgeSetHighlight(graph, path, secondary)],
  };
};

/** `1 edge`, `9 edges`, `2 passes` */
const count = (amount: number, singular: string, plural = `${singular}s`) =>
  `${amount} ${amount === 1 ? singular : plural}`;

/** `a`, `a and b`, `a, b, and c` */
const listOf = (items: readonly string[]) => {
  if (items.length <= 2) return items.join(' and ');
  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`;
};

export const singleSourceExplainer =
  (graph: Graph) =>
  (frame: SingleSourceFrame): Explainer | undefined => {
    switch (frame.type) {
      case 'start':
        return {
          content: `Starting at {${frame.source}}. Every other node starts at a [Distance] of ∞`,
          highlights: [highlights.distances],
        };

      case 'end':
        if (frame.cycleEdgeIds?.length) {
          return {
            content: `Cannot finalize [Distances]. While a [Negative Cycle] exists, we cannot find the cheapest path from {${frame.anchorNodeId}}`,
            highlights: [highlights.distances, highlights.negativeCycle],
          };
        }

        return {
          content: `Done! The [Distances] from {${frame.anchorNodeId}} are as cheap as they can get`,
          highlights: [highlights.distances],
        };

      case 'safe-to-settle': {
        const mustPass = `Every new path to {${frame.node}} must leave through the [Frontier].`;

        if (frame.runnerUp === undefined) {
          return {
            content: `${mustPass} There are no other paths to {${frame.node}} that are cheaper`,
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
          content: `${mustPass} The cheapest [Frontier] node is {${frame.runnerUp.node}} costing ${runnerUp.text}. No path can reach {${frame.node}} for less than ${settling.text}`,
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
          content:
            frame.node === frame.anchorNodeId
              ? `{${frame.node}} is the start node so it gets assigned a distance of ${settled.text}`
              : `{${frame.node}} becomes finalized with a cost of ${settled.text}`,
          highlights: settled.highlights,
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
          `with cost${held.length === 1 ? '' : 's'}`,
          listOf(held.map(({ shown }) => shown.text)),
          held.length === 1 ? '' : 'respectively',
          // one node waiting drops the trailing 'respectively', and joining an
          // empty piece in leaves a double space in front of the next sentence
        ]
          .filter(Boolean)
          .join(' ');

        return {
          content: `${waiting} cannot yet be finalized. {${frame.via.node}} costs ${via.text} to reach, which is cheaper, so a path from {${frame.via.node}} could be cheaper`,
          highlights: [
            ...held.flatMap(({ shown }) => shown.highlights),
            ...via.highlights,
          ],
        };
      }

      case 'explore-node': {
        if (frame.edges.length === 0) {
          return {
            content: `{${frame.node}} has no outbound edges, so pathing through it cannot improve any cost`,
          };
        }

        const onlyOneEdge = frame.edges.length === 1;

        const follow = onlyOneEdge
          ? `Now path through {${frame.edges[0]}}`
          : `Now path through the [${frame.edges.length} edges] leaving {${frame.node}}`;

        const followHighlights = onlyOneEdge
          ? []
          : [createEdgeSetHighlight(graph, frame.edges)];

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
          content: `${follow}, to see if pathing through {${frame.node}} with an initial cost of ${initial.text} reduces the current cost to ${edgesReached}`,
          highlights: [...followHighlights, ...initial.highlights],
        };
      }

      case 'skip-settled': {
        const finalized = cost(graph, frame.distance, frame.path);

        return {
          content: `{${frame.edge}} is not followed, because {${frame.node}} is already finalized at ${finalized.text}`,
          highlights: finalized.highlights,
        };
      }

      case 'relax-edge':
        return {
          content: `Pathing through {${frame.edge}} costs <${graph.getEdge(frame.edge).weight}>`,
        };

      case 'improve-distance': {
        const improved = cost(graph, frame.newDistance, [
          ...frame.basePath,
          frame.edge,
        ]);

        if (frame.oldDistance === undefined) {
          return {
            content: `Nothing has reached {${frame.node}} before, so its distance [Improves] from ∞ to ${improved.text}`,
            highlights: [highlights.improve, ...improved.highlights],
          };
        }

        const had = cost(graph, frame.oldDistance, frame.oldPath);

        return {
          content: `{${frame.node}} already had a route costing ${had.text}. Going through {${frame.via}} is cheaper costing ${improved.text}, so its distance [Improves]`,
          highlights: [
            ...had.highlights,
            ...improved.highlights,
            highlights.improve,
          ],
        };
      }

      case 'keep-distance': {
        const offered = cost(graph, frame.offered, [
          ...frame.basePath,
          frame.edge,
        ]);
        const current = cost(graph, frame.distance, frame.currentPath);

        return {
          content: `${offered.text} does not decrease the cost of reaching {${frame.node}} which currently costs ${current.text}. Therefore the current cost [Remains]`,
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
          content: `${nodesCount} node${singular ? '' : 's'} stayed at a [Distance] of ∞ since no edges lead to ${singular ? 'it' : 'them'}`,
          highlights: [highlights.distances],
        };
      }

      // bellman ford only

      case 'begin-pass': {
        return {
          content: `Pass ${frame.pass} of ${frame.totalPasses}. The cheapest path uses at most ${count(frame.pass, 'edge')}. Sweeping edges in [Order]`,
          highlights: [highlights.sweep],
        };
      }

      case 'skip-unreachable':
        return {
          content: `{${frame.edge}} is swept, but {${frame.from}} still costs ∞, so {${frame.to}} cannot be updated`,
        };

      case 'pass-settled':
        return {
          content: `Pass ${frame.pass} did not improve any costs meaning the [Distances] are final`,
          highlights: [highlights.distances],
        };

      case 'begin-verification': {
        return {
          content: `After ${count(frame.passesDone, 'pass', 'passes')} all [Distances] are final. A verification sweep will confirm there are no [negative cycles]`,
          highlights: [highlights.distances, highlights.negativeCycle],
        };
      }

      case 'verify-edge': {
        const held = cost(graph, frame.current, frame.currentPath);

        return {
          content: `{${frame.edge}} does not lower the cost to {${frame.to}} which costs ${held.text}`,
          highlights: held.highlights,
        };
      }

      case 'no-negative-cycle':
        return {
          content: `The sweep improved nothing, so [Distances] are final`,
          highlights: [highlights.distances],
        };

      case 'negative-cycle': {
        const stillImproves = `{${frame.edge}} lowers the cost to {${frame.node}}`;

        if (!frame.loop) {
          return {
            content: `${stillImproves}. The [Negative Cycle] check fails so the algorithm cannot give a cheapest path`,
            highlights: [highlights.negativeCycle],
          };
        }

        const lap = cost(graph, frame.loop.lapCost, frame.loop.edges);

        return {
          content: `${stillImproves}. The [negative cycle] check fails so the algorithm cannot give a cheapest path. The cycle costs ${lap.text}`,
          highlights: [highlights.negativeCycle, ...lap.highlights],
        };
      }
    }
  };
