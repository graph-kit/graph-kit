import { Color } from '@core/utils/colors';

import { GEdge, Graph } from '../graph/types.ts';
import { createPathThemer } from '../theme/path/createPathThemer.ts';
import { ExplainerHighlight } from './types.ts';

/**
 * lights a run of edges up while the words naming it are hovered.
 *
 * the explainer's way of reaching {@link createPathThemer}, so that a route
 * pointed at from prose and a route pointed at from a panel paint identically
 */
export const createEdgeSetHighlight = (
  graph: Graph,
  edgeIds: readonly GEdge['id'][],
  tooltipLabel?: ExplainerHighlight['tooltipLabel'],
  /** defaults to the color focus wears, see {@link createPathThemer} */
  color?: Color,
): ExplainerHighlight => {
  const { themer } = createPathThemer(graph, { path: edgeIds, color });

  return {
    tooltipLabel,
    activate: () => themer.activate(),
    deactivate: () => themer.deactivate(),
  };
};
