import { Explainer, ExplainerHighlight } from '@magic/shared/explainer';
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

/**
 * spells a distance back out as the sum it came from, so a reader can see what
 * the number is made of rather than being handed a total to trust
 */
const costBreakdown = (
  graph: Graph,
  path: readonly GEdge['id'][],
  total: string,
): ExplainerHighlight => ({
  tooltipLabel: () => {
    const edgeName = (id: GEdge['id']) => {
      const { source, target } = graph.getEdge(id);
      return `${graph.getNode(source).label}${graph.getNode(target).label}`;
    };

    return `${path.map(edgeName).join(' + ')} = ${total}, the cost from the start node to this node along the cheapest path found so far`;
  },
});

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
          // one per [Frontier] mention, the second only appears alongside a runner up
          highlights: [highlights.frontier, highlights.frontier],
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

        const named = frame.edges.map(ref);

        const follow =
          named.length === 1
            ? `Now follow the single edge leaving ${ref(frame.node)}, ${named[0]}`
            : `Now follow each of the ${named.length} edges leaving ${ref(frame.node)}, ${listOf(named)}`;

        //  only for the start node we dont ask how going through "0 cost" will improve the cost of other nodes
        if (frame.node === frame.anchorNodeId) {
          return {
            content: `${follow}, to see the cost of connecting adjacent nodes`,
          };
        }

        const reached = listOf(
          frame.edges.map((edge) => ref(graph.getEdge(edge).target)),
        );

        return {
          content: `${follow}, to see whether going through ${ref(frame.node)} with a [Base Cost] of <${frame.distance}> reduces the current cost of ${reached}`,
          highlights: [
            costBreakdown(graph, frame.basePath, String(frame.distance)),
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
        const { weight, source } = graph.getEdge(frame.edge);

        // nothing was spent before the start node, so there is no sum to break down
        const arrival =
          source === frame.anchorNodeId
            ? '.'
            : `: the <${frame.base}> already spent getting to ${ref(frame.via)}, plus <${weight}> for ${ref(frame.edge)}.`;

        const reached = `Reaching ${ref(frame.node)} through ${ref(frame.via)} costs <${frame.newDistance}>${arrival}`;

        if (frame.oldDistance === undefined) {
          return {
            content: `${reached} Nothing has reached ${ref(frame.node)} before, so its cost [Improves] from ∞`,
            highlights: [highlights.improve],
          };
        }

        return {
          content: `${reached} That beats its [Previous Cost] of <${frame.oldDistance}>, so ${ref(frame.node)} [Improves] to <${frame.newDistance}>`,
          highlights: [
            costBreakdown(graph, frame.oldPath, String(frame.oldDistance)),
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
