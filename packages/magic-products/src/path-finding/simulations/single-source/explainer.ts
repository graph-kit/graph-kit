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
    tooltipLabel: 'The cheapest distance to the node so far',
    ...componentSlotHighlight(distancesSlotId),
  },
  improve: {
    tooltipLabel:
      'The distance we just found is cheaper than what we had before, so we update the distance',
    ...componentSlotHighlight(distancesSlotId),
  },
  keep: {
    tooltipLabel:
      'The distance we just found is not cheaper than what we had before, so we keep the distance we already had',
    ...componentSlotHighlight(distancesSlotId),
  },
  frontier: {
    tooltipLabel:
      'All nodes that have been explored but not finalized yet. The distances may be improved with a different path.',
    ...componentSlotHighlight(frontierSlotId),
  },
} as const satisfies Record<string, ExplainerHighlight>;

const costBreakdown = (
  graph: Graph,
  path: readonly string[],
  total: string,
): ExplainerHighlight => ({
  tooltipLabel: () => {
    if (path.length === 0)
      return 'The start node, which costs nothing to reach';

    const edgeName = (id: string) => {
      const { source, target } = graph.getEdge(id);
      return `${graph.getNode(source).label}${graph.getNode(target).label}`;
    };

    return `${path.map(edgeName).join(' + ')} = ${total}, the cheapest path found so far`;
  },
});

export const singleSourceExplainer =
  (graph: Graph) =>
  (frame: SingleSourceFrame): Explainer | undefined => {
    if (frame.type === 'start') {
      return {
        content: `Starting at {${frame.source}}. Every other node starts at a [Distance] of ∞`,
        highlights: [highlights.distances],
      };
    }

    if (frame.type === 'end') {
      return {
        content: `Done! The [Distances] from {${frame.anchorNodeId}} are as cheap as they can get`,
        highlights: [highlights.distances],
      };
    }

    if (frame.type === 'safe-to-settle') {
      const mustPass = `Every other path to {${frame.node}} has to leave through the [Frontier].`;

      const waiting =
        frame.runnerUp === undefined
          ? `There are no other paths to {${frame.node}}`
          : `The cheapest upstream node is {${frame.runnerUp.node}} with a current cost of <${frame.runnerUp.distance}>. Edge costs cannot be negative, so nothing can reach {${frame.node}} for less than <${frame.distance}>`;

      return {
        content: `${mustPass} ${waiting}`,
        highlights: [highlights.frontier],
      };
    }

    if (frame.type === 'settle-node') {
      if (frame.node === frame.anchorNodeId) {
        return {
          content: `{${frame.node}} is the start node so it gets assigned a distance of <${frame.distance}>`,
        };
      }

      return {
        content: `{${frame.node}} becomes finalized with a cost of <${frame.distance}>`,
      };
    }

    if (frame.type === 'still-tentative') {
      const named = frame.waiting.map(
        ({ node, distance }) =>
          `{${node}} with a current cost of <${distance}>`,
      );

      const cheaper = `{${frame.via.node}} costs only <${frame.via.distance}> to reach, which is less than`;

      if (named.length === 1) {
        return {
          content: `${named[0]} cannot yet be finalized. ${cheaper} that, so an edge out of {${frame.via.node}}, or a chain of them, could still arrive for less`,
        };
      }

      const list =
        named.length === 2
          ? `${named[0]} and ${named[1]}`
          : `${named.slice(0, -1).join(', ')}, and ${named[named.length - 1]}`;

      return {
        content: `${list} cannot yet be finalized. ${cheaper} any of them, so an edge out of {${frame.via.node}}, or a chain of them, could still arrive for less`,
      };
    }

    if (frame.type === 'explore-node') {
      if (frame.edgeCount === 0) {
        return {
          content: `{${frame.node}} has no outbound edges, so pathing through it cannot improve any cost`,
        };
      }

      const edges =
        frame.edgeCount === 1
          ? `the single edge leaving {${frame.node}}`
          : `each of the ${frame.edgeCount} edges leaving {${frame.node}}`;

      //  only for the start node we dont ask how going through "0 cost" will improve the cost of other nodes
      if (frame.node === frame.anchorNodeId) {
        return {
          content: `Now follow ${edges} to see the cost of connecting adjacent nodes`,
        };
      }
      return {
        content: `Now follow ${edges}, and see whether going through it with a [base cost] of <${frame.distance}> reduces the current cost of downstream nodes`,
        highlights: [
          costBreakdown(graph, frame.basePath, String(frame.distance)),
        ],
      };
    }

    if (frame.type === 'skip-settled') {
      return {
        content: `{${frame.edge}} is not followed, because {${frame.node}} is already finalized at <${frame.distance}> and no path can beat a finalized cost`,
      };
    }

    if (frame.type === 'relax-edge') {
      const { weight } = graph.getEdge(frame.edge);
      return {
        content: `Pathing through {${frame.edge}} costs <${weight}>, on top of the <${frame.base}> already spent reaching {${frame.from}}, for a total of <${frame.offered}>`,
      };
    }

    if (frame.type === 'improve-distance') {
      return {
        content: `<${frame.newDistance}> Beats <${formatDistance(frame.oldDistance)}>, So [Improving] {${frame.node}}`,
        highlights: [highlights.improve],
      };
    }

    if (frame.type === 'keep-distance') {
      return {
        content: `<${frame.offered}> does not decrease the cost of reaching {${frame.node}} which currently costs <${frame.distance}>. Therefore the current cost [Remains]`,
        highlights: [highlights.keep],
      };
    }

    if (frame.type === 'unreachable') {
      const count = frame.nodes.length;
      const plural = count === 1;
      return {
        content: `${count} node${plural ? 's' : ''} stayed at a [Distance] of ∞ since no edges lead to ${plural ? 'them' : 'it'}`,
        highlights: [highlights.distances],
      };
    }

    // not dijkstras below here, so we can ignore these frames for now

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
