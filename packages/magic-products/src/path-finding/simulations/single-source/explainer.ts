import { displayNumber } from '@core/utils/math';
import {
  Explainer,
  ExplainerHighlight,
  createEdgeSetHighlight,
} from '@magic/shared/explainer';
import { GEdge, GNode, Graph } from '@magic/shared/graph';

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

/** `a`, `a and b`, `a, b, and c` */
const listOf = (items: readonly string[]) => {
  if (items.length <= 2) return items.join(' and ');
  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`;
};

/** graph elements are referenced in explainer text by wrapping their id in `{}` */
const ref = (id: GNode['id'] | GEdge['id']) => `{${id}}`;

export const singleSourceExplainer =
  (graph: Graph) =>
  (frame: SingleSourceFrame): Explainer | undefined => {
    switch (frame.type) {
      case 'start':
        return {
          content: `Starting at ${ref(frame.source)}. Every other node starts at a [Distance] of ∞`,
          highlights: [highlights.distances],
        };

      case 'end':
        return {
          content: `Done! The [Distances] from ${ref(frame.anchorNodeId)} are as cheap as they can get`,
          highlights: [highlights.distances],
        };

      case 'safe-to-settle': {
        const mustPass = `Every other path to ${ref(frame.node)} has to leave through the [Frontier].`;

        const waiting =
          frame.runnerUp === undefined
            ? `There are no other paths to ${ref(frame.node)} that can be cheaper`
            : `The cheapest [Frontier] node is ${ref(frame.runnerUp.node)} with a current cost of <${frame.runnerUp.distance}>. Edge costs cannot be negative, so nothing can reach ${ref(frame.node)} for less than <${frame.distance}>`;

        return {
          content: `${mustPass} ${waiting}`,
          // one per [Frontier] mention, and the second is only mentioned when
          // there is a runner up to name
          highlights:
            frame.runnerUp === undefined
              ? [highlights.frontier]
              : [highlights.frontier, highlights.frontier],
        };
      }

      case 'settle-node':
        return {
          content:
            frame.node === frame.anchorNodeId
              ? `${ref(frame.node)} is the start node so it gets assigned a distance of <${frame.distance}>`
              : `${ref(frame.node)} becomes finalized with a cost of <${frame.distance}>`,
        };

      case 'still-tentative': {
        const waiting = listOf(
          frame.waiting.map(
            ({ node, distance }) =>
              `${ref(node)} with a current cost of <${distance}>`,
          ),
        );
        const beaten = frame.waiting.length === 1 ? 'that' : 'them';

        return {
          content: `${waiting} cannot yet be finalized. ${ref(frame.via.node)} costs only <${frame.via.distance}> to reach, which is cheaper than ${beaten}, so a path leading from ${ref(frame.via.node)} could still be cheaper`,
        };
      }

      case 'explore-node': {
        if (frame.edges.length === 0) {
          return {
            content: `${ref(frame.node)} has no outbound edges, so pathing through it cannot improve any cost`,
          };
        }

        /*
          past one edge the sentence names the count rather than the edges, and
          hands the count a highlight that lights all of them up on the graph.
          the list it replaces grew with the node's degree and said nothing the
          graph was not already able to show
        */
        const single = frame.edges.length === 1;

        const follow = single
          ? `Now follow the ${ref(frame.edges[0])}`
          : `Now follow each of the [${frame.edges.length} edges] leaving ${ref(frame.node)}`;

        const followHighlights = single
          ? []
          : [createEdgeSetHighlight(graph, frame.edges)];

        //  only for the start node we dont ask how going through "0 cost" will improve the cost of other nodes
        if (frame.node === frame.anchorNodeId) {
          return {
            content: `${follow}, to see the cost of connecting adjacent nodes`,
            highlights: followHighlights,
          };
        }

        const reached = listOf(
          frame.edges.map((edge) => ref(graph.getEdge(edge).target)),
        );

        /*
          the base cost is the number itself rather than a label beside it, so
          hovering it paints the path the number was built from. the sum that
          built it is dropped: the edges lighting up on the graph say the same
          thing, and say it where the reader is already looking
        */
        const { primary, secondary } = displayNumber(frame.distance);

        return {
          content: `${follow}, to see whether going through ${ref(frame.node)} with a [Base Cost of ${primary}] reduces the current cost of ${reached}`,
          highlights: [
            ...followHighlights,
            createEdgeSetHighlight(graph, frame.basePath, secondary),
          ],
        };
      }

      case 'skip-settled':
        return {
          content: `${ref(frame.edge)} is not followed, because ${ref(frame.node)} is already finalized at <${frame.distance}> and no path can beat a finalized cost`,
        };

      case 'relax-edge':
        return {
          content: `Pathing through ${ref(frame.edge)} costs <${graph.getEdge(frame.edge).weight}>`,
        };

      case 'improve-distance': {
        const total = displayNumber(frame.newDistance);

        const reached = `Reaching ${ref(frame.node)} through ${ref(frame.via)} costs [${total.primary}]`;

        // the route the sum just found: the way to `via`, plus the edge closing it
        const reachedHighlight = createEdgeSetHighlight(
          graph,
          [...frame.basePath, frame.edge],
          total.secondary,
        );

        if (frame.oldDistance === undefined) {
          return {
            content: `${reached} Nothing has reached ${ref(frame.node)} before, so its cost [Improves] from ∞`,
            highlights: [reachedHighlight, highlights.improve],
          };
        }

        // like the base cost, the number carries the highlight, and hovering it
        // paints the route being beaten rather than spelling its sum out
        const { primary, secondary } = displayNumber(frame.oldDistance);

        return {
          content: `${reached} That beats its [Previous Cost of ${primary}], so ${ref(frame.node)} [Improves] to <${frame.newDistance}>`,
          highlights: [
            reachedHighlight,
            createEdgeSetHighlight(graph, frame.oldPath, secondary),
            highlights.improve,
          ],
        };
      }

      case 'keep-distance':
        return {
          content: `<${frame.offered}> does not decrease the cost of reaching ${ref(frame.node)} which currently costs <${frame.distance}>. Therefore the current cost [Remains]`,
          highlights: [highlights.keep],
        };

      case 'unreachable': {
        const count = frame.nodes.length;
        const singular = count === 1;
        return {
          content: `${count} node${singular ? '' : 's'} stayed at a [Distance] of ∞ since no edges lead to ${singular ? 'it' : 'them'}`,
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
          content: `${ref(frame.node)} Can Still Get Cheaper! A Negative Cycle Means No Shortest Path Exists`,
        };
    }
  };
