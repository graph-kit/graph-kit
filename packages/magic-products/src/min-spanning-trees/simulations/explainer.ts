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
  return `${described.slice(0, -1).join(', ')} And ${described.at(-1)}`;
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
  added: {
    tooltipLabel: 'Edge added to the solution',
  },
} as const satisfies Record<string, ExplainerHighlight>;

const highlights = {
  ...sharedHighlights,
  considering: {
    tooltipLabel: 'Edges eligible to be added. The cheapest one wins',
    ...componentSlotHighlight(primsSlotIds.considering),
  },
  excluded: {
    tooltipLabel: 'Edges left out of the minimum spanning tree',
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
    tooltipLabel: 'Edges left out of the minimum spanning tree',
    ...componentSlotHighlight(kruskalsSlotIds.excluded),
  },
  components: {
    tooltipLabel:
      'A group of nodes already reachable from each other. Every node starts as its own component, and each edge added merges two of them',
  },
  forest: {
    tooltipLabel: 'Multiple trees, since the graph is disconnected',
  },
} as const satisfies Record<string, ExplainerHighlight>;

export const primsExplainer =
  (graph: Graph) =>
  (frame: PrimsFrame): Explainer | undefined => {
    if (frame.type === 'start') {
      return {
        content: `Starting Prim's At {${frame.anchorNodeId}}`,
        highlights: [highlights.tree],
      };
    }

    if (frame.type === 'end') {
      const cost = frame.treeEdgeIds
        .map((id) => graph.getEdge(id).weight)
        .reduce((sum, weight) => sum.add(weight), new Fraction(0));
      return {
        content: `Done! The Final [Tree] Costs <${cost}>`,
        highlights: [highlights.tree],
      };
    }

    if (frame.type === 'consider-edges') {
      return {
        content: `Every Edge On The [Tree]'s Border Goes [In Consideration]`,
        highlights: [highlights.tree, highlights.considering],
      };
    }

    if (frame.type === 'select-edge') {
      if (frame.tiedEdges) {
        return {
          content: `${listEdges(graph, frame.tiedEdges)} Tie For Cheapest, So {${frame.edge}} Is [Added]`,
          highlights: [highlights.added],
        };
      }

      return {
        content: `{${frame.edge}} Is The Cheapest [In Consideration], So It's [Added]`,
        highlights: [highlights.considering, highlights.added],
      };
    }

    if (frame.type === 'exclude-edges') {
      const plural = frame.edges.length > 1;
      return {
        content: `${listEdges(graph, frame.edges)} Would Create A Cycle, So ${plural ? "They're" : "It's"} [Excluded]`,
        highlights: [highlights.excluded],
      };
    }

    // nodes only go unreached if the graph is disconnected
    if (frame.type === 'unreachable') {
      const count = frame.nodes.length;
      const themer = highlightNodes(graph, frame.nodes);
      return {
        content:
          count === 1
            ? `[1 Node] Can't Be Reached From {${frame.anchorNodeId}}, So It Is Left Out`
            : `[${count} Nodes] Can't Be Reached From {${frame.anchorNodeId}}, So They Are Left Out`,
        highlights: [themer],
      };
    }
  };

export const kruskalsExplainer =
  (graph: Graph) =>
  (frame: KruskalsFrame): Explainer | undefined => {
    if (frame.type === 'start') {
      return {
        content: `Sort All Edges By Weight, Cheapest First, Adding Them To [In Consideration]`,
        highlights: [kruskalsHighlights.considering],
      };
    }

    if (frame.type === 'end') {
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
