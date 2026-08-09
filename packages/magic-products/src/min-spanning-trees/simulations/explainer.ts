import { Explainer, ExplainerHighlight } from '@magic/shared/explainer';
import { Graph } from '@magic/shared/graph';

import { PrimsFrame } from './frame.ts';

const describeEdge = (graph: Graph, edgeId: string) => {
  const edge = graph.getEdge(edgeId);
  return `{${edge.source}}-{${edge.target}} (${edge.weight.toFraction()})`;
};

const listEdges = (graph: Graph, edgeIds: readonly string[]) => {
  const described = edgeIds.map((id) => describeEdge(graph, id));
  if (described.length <= 1) return described.join('');
  return `${described.slice(0, -1).join(', ')} and ${described.at(-1)}`;
};

const highlights = {
  tree: {
    tooltipLabel: 'The edges already grown into the minimum spanning tree',
  },
  frontier: {
    tooltipLabel:
      'Every edge currently eligible to grow into the tree. It connects a tree node to a node outside of the tree',
  },
  added: {
    tooltipLabel: 'The edge just chosen to grow the tree',
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
        content: `The [Frontier] now includes every edge connecting the [Tree] to a node not in the [Tree]: ${listEdges(graph, frame.edges)}`,
        highlights: [highlights.frontier, highlights.tree, highlights.tree],
      };
    }

    if (frame.type === 'compare-edges') {
      const left = describeEdge(graph, frame.left);
      const right = describeEdge(graph, frame.right);
      return {
        content: `Comparing weights of ${left} to ${right}. Which one costs less?`,
      };
    }

    if (frame.type === 'select-edge') {
      const winner = describeEdge(graph, frame.edge);

      if (frame.tiedEdges) {
        const tied = listEdges(graph, frame.tiedEdges);
        return {
          content: `${tied} are tied for for lowest weight, so ${winner} is chosen arbitrarily and [Added] to the [Tree]`,
          highlights: [highlights.added, highlights.tree],
        };
      }

      return {
        content: `${winner} is chosen because it has the smallest weight, so it gets [Added] to the [Tree]`,
        highlights: [highlights.added, highlights.tree],
      };
    }

    if (frame.type === 'exclude-edges') {
      const excluded = listEdges(graph, frame.edges);
      const plural = frame.edges.length > 1;
      return {
        content: `${excluded} ${plural ? 'are' : 'is'} ruled out because both ends are already in the [Tree], therefore ${plural ? 'they' : 'it'} would cause a loop`,
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
