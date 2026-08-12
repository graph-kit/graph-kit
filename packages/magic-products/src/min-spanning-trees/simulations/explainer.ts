import { Explainer, ExplainerHighlight } from '@magic/shared/explainer';
import { Graph } from '@magic/shared/graph';
import Fraction from 'fraction.js';

import { KruskalsFrame, PrimsFrame } from './frame.ts';
import { primsSlotIds } from './shared.ts';

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

const componentSlotHighlight = (
  slot: keyof typeof primsSlotIds,
): ExplainerHighlight => ({
  activate: (graph) =>
    graph.magic.componentSlots.setHighlighted(primsSlotIds[slot]),
  deactivate: (graph) => graph.magic.componentSlots.clearHighlighted(),
});

const highlights = {
  tree: {
    tooltipLabel: 'The edges already in the minimum spanning tree',
  },
  nonTree: {
    tooltipLabel: 'The edges not yet in the minimum spanning tree',
  },
  considering: {
    tooltipLabel:
      'Every edge that connects a tree node to a non-tree node is currently eligible to be added to the minimum spanning tree',
    ...componentSlotHighlight('considering'),
  },
  excluded: {
    tooltipLabel:
      'Edges ruled out because both ends are already in the minimum spanning tree and adding it would create a loop',
    ...componentSlotHighlight('excluded'),
  },
  added: {
    tooltipLabel: 'This edge is now part of the minimum spanning tree',
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
        content: `Done! The [Tree] is complete with ${edges} edge${edges === 1 ? '' : 's'} and a total cost of ${cost}`,
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
        content: `${count} node${plural ? 's' : ''} never ${plural ? 'connect' : 'connects'} to the [Tree]: the graph is disconnected`,
        highlights: [highlights.tree],
      };
    }
  };

export const kruskalsExplainer =
  (graph: Graph) =>
  (frame: KruskalsFrame): Explainer | undefined => {
    if (frame.type === 'start') {
      return {
        content: `Sorting every edge by weight, cheapest first: ${listEdges(graph, frame.sortedEdges)}`,
      };
    }

    if (frame.type === 'end') {
      const edges = frame.treeEdgeIds.length;
      const cost = frame.treeEdgeIds
        .map((id) => graph.getEdge(id).weight)
        .reduce((sum, weight) => sum.add(weight), new Fraction(0));
      return {
        content: `Done! The [Tree] is complete with ${edges} edge${edges === 1 ? '' : 's'} and a total cost of ${cost}`,
        highlights: [highlights.tree],
      };
    }

    if (frame.type === 'consider-edge') {
      return {
        content: `Considering ${describeEdge(graph, frame.edge)}, the next cheapest edge not yet decided`,
      };
    }

    if (frame.type === 'accept-edge') {
      return {
        content: `${describeEdge(graph, frame.edge)} connects two parts of the graph that were still separate, so it's [Added] to the [Tree]`,
        highlights: [highlights.added, highlights.tree],
      };
    }

    if (frame.type === 'reject-edge') {
      return {
        content: `${describeEdge(graph, frame.edge)} already connects two nodes in the same part of the [Tree], so adding it would only create a loop. It's ruled out`,
        highlights: [highlights.tree],
      };
    }

    if (frame.type === 'all-connected') {
      const count = frame.edges.length;
      const plural = count > 1;
      return {
        content: `Every node is already connected, so the ${count} remaining edge${plural ? 's are' : ' is'} not needed`,
        highlights: [highlights.tree],
      };
    }

    if (frame.type === 'unreachable') {
      const count = frame.nodes.length;
      const plural = count > 1;
      return {
        content: `${count} node${plural ? 's' : ''} never ${plural ? 'connect' : 'connects'} to the [Tree]: the graph is disconnected`,
        highlights: [highlights.tree],
      };
    }
  };
