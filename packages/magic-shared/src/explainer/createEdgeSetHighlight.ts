import { GEdge, Graph } from '../graph/types.ts';
import { ExplainerHighlight } from './types.ts';

export const createEdgeSetHighlight = (
  graph: Graph,
  edgeIds: readonly GEdge['id'][],
  tooltipLabel?: ExplainerHighlight['tooltipLabel'],
): ExplainerHighlight => {
  const ids = new Set(edgeIds);

  const themer = graph.theme.createThemer({
    surface: {
      'edge.default.color': (edge) =>
        ids.has(edge.id)
          ? graph.focus.theme._resolveToken('edge.focus.color', edge)
          : undefined,
    },
  });

  return {
    tooltipLabel,
    activate: () => themer.activate(),
    deactivate: () => themer.deactivate(),
  };
};
