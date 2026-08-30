import { GEdge, Graph } from '../graph/types.ts';
import { ExplainerHighlight } from './types.ts';

/**
 * an explainer highlight that paints a whole set of edges while the segment it
 * sits on is hovered, so a phrase standing in for several edges — "each of the
 * 3 edges leaving A" — can still show which ones it means without spelling
 * every one of them out in the sentence.
 *
 * the single element counterpart is the `{id}` segment built by
 * {@link useGraphElementRefExplainerSegment}, and this borrows the same focus
 * color on purpose: pointing at a set should read as the same gesture as
 * pointing at one element, only wider
 */
export const createEdgeSetHighlight = (
  graph: Graph,
  edgeIds: readonly GEdge['id'][],
  tooltipLabel?: ExplainerHighlight['tooltipLabel'],
): ExplainerHighlight => {
  const ids = new Set(edgeIds);

  // proxy default color to focus color, for every edge in the set at once
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
