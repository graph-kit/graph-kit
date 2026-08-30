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

type SlotId = typeof distancesSlotId | typeof frontierSlotId;

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
        ].join(' ');

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
          content: `{${frame.edge}} is not followed, because {${frame.node}} is already finalized at ${finalized.text} and no path can beat a finalized cost`,
          highlights: finalized.highlights,
        };
      }

      case 'relax-edge':
        return {
          content: `Pathing through {${frame.edge}} costs <${graph.getEdge(frame.edge).weight}>`,
        };

      case 'improve-distance': {
        if (frame.oldDistance === undefined) {
          return {
            content: `Nothing has reached {${frame.node}} before, so its cost [Improves] from ∞`,
            highlights: [highlights.improve],
          };
        }

        const previousPath = cost(graph, frame.oldDistance, frame.oldPath);
        const improvedPath = cost(graph, frame.newDistance, [
          ...frame.basePath,
          frame.edge,
        ]);

        return {
          content: `That beats its previous cost of ${previousPath.text}, so {${frame.node}} [Improves] to ${improvedPath.text}`,
          highlights: [
            ...previousPath.highlights,
            highlights.improve,
            ...improvedPath.highlights,
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

      // not dijkstras below here, so we can ignore these frames for now

      case 'begin-pass':
        return {
          content: `Pass ${frame.pass} of ${frame.totalPasses}: Sweeping Every Edge Once More`,
        };

      case 'pass-settled':
        return {
          content: `Pass ${frame.pass} Changed Nothing, So No Later Pass Will Either. [Distances] Are Final`,
          highlights: [highlights.distances],
        };

      case 'negative-cycle':
        return {
          content: `{${frame.node}} Can Still Get Cheaper! A Negative Cycle Means No Shortest Path Exists`,
        };
    }
  };
