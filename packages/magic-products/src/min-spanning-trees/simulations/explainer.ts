import { Explainer, ExplainerHighlight } from '@magic/shared/explainer';
import { Graph } from '@magic/shared/graph';
import { createNodeIdThemer } from '@magic/shared/theme';
import Fraction from 'fraction.js';

import { KruskalsFrame, PrimsFrame } from './frame.ts';

export const primsSlotIds = {
  considering: 'min-spanning-trees/prims/considering',
  excluded: 'min-spanning-trees/prims/excluded',
} as const;

export const kruskalsSlotIds = {
  considering: 'min-spanning-trees/kruskals/considering',
  excluded: 'min-spanning-trees/kruskals/excluded',
} as const;

const listEdges = (graph: Graph, edgeIds: readonly string[]) => {
  const described = edgeIds
    .map((id) => graph.getEdge(id))
    .sort((a, b) => a.weight.compare(b.weight))
    .map((edge) => `{${edge.id}}`);
  if (described.length <= 1) return described.join('');
  return `${described.slice(0, -1).join(', ')} and ${described.at(-1)}`;
};

const componentSlotHighlight = (slotId: string): ExplainerHighlight => ({
  activate: ({ shell }) => shell.componentSlots.setHighlighted(slotId),
  deactivate: ({ shell }) => shell.componentSlots.clearHighlighted(),
});

const highlightNodes = (graph: Graph, nodeIds: readonly string[]) =>
  createNodeIdThemer(graph, 'active', nodeIds).themer;

const sharedHighlights = {
  tree: {
    tooltipLabel: 'The edges in the minimum spanning tree',
  },
  nonTree: {
    tooltipLabel: 'The edges not yet in the minimum spanning tree',
  },
  added: {
    tooltipLabel: 'This edge is now part of the minimum spanning tree',
  },
} as const satisfies Record<string, ExplainerHighlight>;

const highlights = {
  ...sharedHighlights,
  considering: {
    tooltipLabel:
      'Every edge that connects a tree node to a non-tree node is currently eligible to be added to the minimum spanning tree',
    ...componentSlotHighlight(primsSlotIds.considering),
  },
  excluded: {
    tooltipLabel:
      'Edges ruled out because both ends are already in the minimum spanning tree and adding it would create a loop',
    ...componentSlotHighlight(primsSlotIds.excluded),
  },
} as const satisfies Record<string, ExplainerHighlight>;

const kruskalsHighlights = {
  ...sharedHighlights,
  considering: {
    tooltipLabel: 'Every edge, cheapest first, waiting to be looked at',
    ...componentSlotHighlight(kruskalsSlotIds.considering),
  },
  excluded: {
    tooltipLabel:
      'Edges ruled out because both ends are already connected to each other',
    ...componentSlotHighlight(kruskalsSlotIds.excluded),
  },
  components: {
    tooltipLabel:
      'A group of nodes already reachable from each other. Every node starts as its own component, and each edge added merges two of them',
  },
  forest: {
    tooltipLabel: 'A forest is multiple trees, since the graph is disconnected',
  },
} as const satisfies Record<string, ExplainerHighlight>;

export const primsExplainer =
  (graph: Graph) =>
  (frame: PrimsFrame): Explainer | undefined => {
    if (frame.type === 'start') {
      return {
        content: `Starting the [Tree] at {${frame.start}}`,
        highlights: [highlights.tree],
      };
    }

    if (frame.type === 'end') {
      const edges = frame.treeEdgeIds.length;
      const cost = frame.treeEdgeIds
        .map((id) => graph.getEdge(id).weight)
        .reduce((sum, weight) => sum.add(weight));
      return {
        content: `Done! The [Tree] is complete with ${edges} edge${edges === 1 ? '' : 's'} and a total cost of <${cost}>`,
        highlights: [highlights.tree],
      };
    }

    if (frame.type === 'consider-edges') {
      return {
        content: `The list of edges [In Consideration] now includes every edge connecting a [Tree] node to a [Non-Tree] node: ${listEdges(graph, frame.edges)}`,
        highlights: [
          highlights.considering,
          highlights.tree,
          highlights.nonTree,
        ],
      };
    }

    if (frame.type === 'select-edge') {
      const winner = `{${frame.edge}}`;

      if (frame.tiedEdges) {
        const tied = listEdges(graph, frame.tiedEdges);
        return {
          content: `Edges ${tied} are tied for cheapest of the edges [In Consideration], so ${winner} is chosen arbitrarily and [Added] to the [Tree]`,
          highlights: [
            highlights.considering,
            highlights.added,
            highlights.tree,
          ],
        };
      }

      return {
        content: `Edge ${winner} is the cheapest of the edges [In Consideration], so it gets [Added] to the [Tree]`,
        highlights: [highlights.considering, highlights.added, highlights.tree],
      };
    }

    if (frame.type === 'excluding-edges') {
      const excluded = listEdges(graph, frame.edges);
      const plural = frame.edges.length > 1;
      return {
        content: `Edge${plural ? 's' : ''} ${excluded} ${plural ? 'are' : 'is'} [Excluded] because both ends are already in the [Tree], therefore ${plural ? 'they' : 'it'} would create a cycle`,
        highlights: [highlights.excluded, highlights.tree],
      };
    }

    if (frame.type === 'exclude-edges') {
      const excluded = listEdges(graph, frame.edges);
      const plural = frame.edges.length > 1;
      return {
        content: `Edge${plural ? 's' : ''} ${excluded} ${plural ? 'are' : 'is'} added to the [Excluded] list`,
        highlights: [highlights.excluded],
      };
    }

    if (frame.type === 'unreachable') {
      const count = frame.nodes.length;
      const plural = count > 1;
      return {
        content: `${count} node${plural ? 's' : ''} never ${plural ? 'connect' : 'connects'} to the [Tree] because the graph is disconnected`,
        highlights: [highlights.tree],
      };
    }
  };

export const kruskalsExplainer =
  (graph: Graph) =>
  (frame: KruskalsFrame): Explainer | undefined => {
    if (frame.type === 'start') {
      return {
        content: `Sort All Edged By Weight, Cheapest First, Adding It To [In Consideration]`,
        highlights: [kruskalsHighlights.considering],
      };
    }

    if (frame.type === 'end') {
      const edges = frame.treeEdgeIds.length;
      const cost = frame.treeEdgeIds
        .map((id) => graph.getEdge(id).weight)
        .reduce((sum, weight) => sum.add(weight), new Fraction(0));
      const isConnected = graph.characteristics.connected.value.isConnected;
      return {
        content: `Done! The Final ${isConnected ? '[Tree]' : '[Forest]'} Costs <${cost}>`,
        highlights: isConnected
          ? [kruskalsHighlights.tree]
          : [kruskalsHighlights.forest],
      };
    }

    if (frame.type === 'consider-edge') {
      return {
        content: `Next [In Consideration] Is {${frame.edge}}`,
        highlights: [kruskalsHighlights.considering],
      };
    }

    if (frame.type === 'accept-edge') {
      return {
        content: `{${frame.edge}} Connects Two [Components], So It's [Added]`,
        highlights: [kruskalsHighlights.components, kruskalsHighlights.added],
      };
    }

    if (frame.type === 'exclude-edge') {
      return {
        content: `{${frame.edge}} Would Create A Cycle, So It's [Excluded]`,
        highlights: [kruskalsHighlights.excluded],
      };
    }

    // nodes only go unreached if graph is disconnected (a forest)
    if (frame.type === 'unreachable') {
      const count = frame.nodes.length;
      const themer = highlightNodes(graph, frame.nodes);
      return {
        content:
          count === 1
            ? `[1 Node] Has No Edges, So It Is Left Out`
            : `[${count} Nodes] Have No Edges, So They Are Left Out`,
        highlights: [themer],
      };
    }
  };
