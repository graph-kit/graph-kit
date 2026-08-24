import { Explainer, ExplainerHighlight } from '@magic/shared/explainer';
import { Graph } from '@magic/shared/graph';
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

const describeEdge = (graph: Graph, edgeId: string) => {
  const edge = graph.getEdge(edgeId);
  return `{${edge.id}}`;
};

const listEdges = (graph: Graph, edgeIds: readonly string[]) => {
  const described = edgeIds
    .map((id) => graph.getEdge(id))
    .sort((a, b) => a.weight.compare(b.weight))
    .map((edge) => describeEdge(graph, edge.id));
  if (described.length <= 1) return described.join('');
  return `${described.slice(0, -1).join(', ')} and ${described.at(-1)}`;
};

const componentSlotHighlight = (slotId: string): ExplainerHighlight => ({
  activate: ({ shell }) => shell.componentSlots.setHighlighted(slotId),
  deactivate: ({ shell }) => shell.componentSlots.clearHighlighted(),
});

const sharedHighlights = {
  tree: {
    tooltipLabel: 'The edges already in the minimum spanning tree',
  },
  nonTree: {
    tooltipLabel: 'The edges not yet in the minimum spanning tree',
  },
  added: {
    tooltipLabel: 'This edge is now part of the minimum spanning tree',
  },
} as const satisfies Record<string, ExplainerHighlight>;

const considerAndExcludeHighlights = (slotIds: {
  considering: string;
  excluded: string;
}) =>
  ({
    considering: {
      tooltipLabel:
        'Every edge that connects a tree node to a non-tree node is currently eligible to be added to the minimum spanning tree',
      ...componentSlotHighlight(slotIds.considering),
    },
    excluded: {
      tooltipLabel:
        'Edges ruled out because both ends are already in the minimum spanning tree and adding it would create a loop',
      ...componentSlotHighlight(slotIds.excluded),
    },
  }) as const satisfies Record<string, ExplainerHighlight>;

const highlights = {
  ...sharedHighlights,
  ...considerAndExcludeHighlights(primsSlotIds),
};

const kruskalsHighlights = {
  ...sharedHighlights,
  ...considerAndExcludeHighlights(kruskalsSlotIds),
  forest: {
    tooltipLabel:
      'The edges already in the minimum spanning forest. A forest consists of multiple minimum spanning trees since the graph is disconnected',
  },
};

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
        content: `Done! The [Tree] is complete with ${edges} edge${edges === 1 ? '' : 's'} and a total cost of ${cost.toFraction()}`,
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
      const winner = describeEdge(graph, frame.edge);

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
        content: `Edge${plural ? 's' : ''} ${excluded} ${plural ? 'are' : 'is'} [Excluded] because both ends are already in the [Tree], therefore ${plural ? 'they' : 'it'} would cause a loop`,
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
        content: `Every edge is sorted by weight, cheapest first, and added to the [Considering] list`,
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
        content: `Done! The ${isConnected ? '[Tree]' : '[Forest]'} is complete with ${edges} edge${edges === 1 ? '' : 's'} and a total cost of ${cost.toFraction()}`,
        highlights: isConnected
          ? [kruskalsHighlights.tree]
          : [kruskalsHighlights.forest],
      };
    }

    if (frame.type === 'consider-edge') {
      return {
        content: `Considering ${describeEdge(graph, frame.edge)}, the cheapest of the edges [In Consideration]`,
        highlights: [kruskalsHighlights.considering],
      };
    }

    if (frame.type === 'accept-edge') {
      const isConnected = graph.characteristics.connected.value.isConnected;
      return {
        content: `${describeEdge(graph, frame.edge)} connects two parts of the graph that were still separate, so it's [Added] to the ${isConnected ? '[Tree]' : '[Forest]'}`,
        highlights: isConnected
          ? [kruskalsHighlights.added, kruskalsHighlights.tree]
          : [kruskalsHighlights.added, kruskalsHighlights.forest],
      };
    }

    if (frame.type === 'reject-edge') {
      const excluded = describeEdge(graph, frame.edge);
      const isConnected = graph.characteristics.connected.value.isConnected;
      return {
        content: `Edge ${excluded} is [Excluded] because both ends are already in the ${isConnected ? '[Tree]' : '[Forest]'}, therefore it would cause a loop`,
        highlights: isConnected
          ? [kruskalsHighlights.excluded, kruskalsHighlights.tree]
          : [kruskalsHighlights.excluded, kruskalsHighlights.forest],
      };
    }

    if (frame.type === 'all-connected') {
      const count = frame.edges.length;
      const plural = count > 1;
      return {
        content: `Every node is already connected, so the ${count} remaining edge${plural ? 's are' : ' is'} [Excluded] without needing a decision`,
        highlights: [kruskalsHighlights.excluded],
      };
    }

    if (frame.type === 'unreachable') {
      const count = frame.nodes.length;
      const plural = count > 1;
      const isConnected = graph.characteristics.connected.value.isConnected;
      return {
        content: `${count} node${plural ? 's' : ''} never ${plural ? 'connect' : 'connects'} to the ${isConnected ? '[Tree]' : '[Forest]'} because it has no edges attached to it.`,
        highlights: isConnected
          ? [kruskalsHighlights.tree]
          : [kruskalsHighlights.forest],
      };
    }
  };
