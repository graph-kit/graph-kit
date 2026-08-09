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
      'Every edge currently eligible - it connects a tree node to a node outside the tree',
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
      return {
        content: `Done! The [Tree] Is Complete With ${edges} Edge${edges === 1 ? '' : 's'}`,
        highlights: [highlights.tree],
      };
    }

    if (frame.type === 'consider-edges') {
      return {
        content: `The [Frontier] Now Includes ${listEdges(graph, frame.edges)} - Every Edge Connecting the [Tree] to a Node Outside It`,
        highlights: [highlights.frontier, highlights.tree],
      };
    }

    if (frame.type === 'compare-edges') {
      const left = describeEdge(graph, frame.left);
      const right = describeEdge(graph, frame.right);
      return {
        content: `Comparing ${left} to ${right} - Which One Costs Less?`,
      };
    }

    if (frame.type === 'select-edge') {
      const winner = describeEdge(graph, frame.edge);

      if (frame.tiedEdges) {
        const tied = listEdges(graph, frame.tiedEdges);
        return {
          content: `${tied} Are Tied for Cheapest, So ${winner} Is Chosen Arbitrarily and [Added] to the [Tree]`,
          highlights: [highlights.added, highlights.tree],
        };
      }

      return {
        content: `${winner} Wins - It Has the Smallest Weight, So It Gets [Added] to the [Tree]`,
        highlights: [highlights.added, highlights.tree],
      };
    }

    if (frame.type === 'exclude-edges') {
      const excluded = listEdges(graph, frame.edges);
      const plural = frame.edges.length > 1;
      return {
        content: `Not Choosing ${excluded} - Both Ends Are Already in the [Tree], So ${plural ? 'They' : 'It'} Would Only Close a Loop`,
        highlights: [highlights.tree],
      };
    }

    if (frame.type === 'unreachable') {
      const count = frame.nodes.length;
      return {
        content: `${count} Node${count === 1 ? '' : 's'} Never Connect to the [Tree]: the Graph Is Disconnected From {${frame.nodes[0]}}`,
        highlights: [highlights.tree],
      };
    }
  };
