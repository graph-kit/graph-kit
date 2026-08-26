import { Graph } from '../graph/types.ts';
import { useEdgeStyles, useNodeStyles } from '../theme/index.ts';
import { ExplainerSegment } from './explainerSegments.ts';
import { ExplainerHighlight } from './types.ts';
import { unparsedExplainerSegment } from './unparsedExplainerSegment.ts';

const useGraphElementExplainerHighlight = (
  graph: Graph,
  id: string,
): ExplainerHighlight => {
  // proxy default color to focus color
  const themer = graph.theme.createThemer({
    surface: {
      'node.default.border.color': (node) =>
        node.id === id
          ? graph.focus.theme._resolveToken('node.focus.border.color', { id })
          : undefined,
      'edge.default.color': (edge) =>
        edge.id === id
          ? graph.focus.theme._resolveToken('edge.focus.color', edge)
          : undefined,
    },
  });
  const node = graph.isNode(id) ? useNodeStyles(graph, id) : undefined;
  const edge = graph.isEdge(id) ? useEdgeStyles(graph, id) : undefined;
  return {
    onUnmounted: () => {
      node?.dispose();
      edge?.dispose();
    },
    activate: themer.activate,
    deactivate: themer.deactivate,
    classes: 'text-white',
    styles: () => {
      return {
        backgroundColor: graph.isEdge(id)
          ? edge?.styles.value.color
          : node?.styles.value.border.color,
      };
    },
  };
};

export const useGraphElementRefExplainerSegment = (
  graph: Graph,
  id: string,
): ExplainerSegment => {
  const inGraph = graph.isNode(id) || graph.isEdge(id);

  if (!inGraph) {
    console.error(`explainer: no graph element under the id "${id}"`);
    return unparsedExplainerSegment(`Graph Element With ID ${id} Not In Graph`);
  }

  return {
    id: crypto.randomUUID(),
    text: () => {
      if (graph.isNode(id)) {
        return graph.theme.tokenResolver('node.text.content', { id });
      }
      const edge = graph.getEdge(id);
      const source = graph.theme.tokenResolver('node.text.content', {
        id: edge.source,
      });
      const target = graph.theme.tokenResolver('node.text.content', {
        id: edge.target,
      });
      return `${source}${target}`;
    },
    highlight: useGraphElementExplainerHighlight(graph, id),
  };
};
