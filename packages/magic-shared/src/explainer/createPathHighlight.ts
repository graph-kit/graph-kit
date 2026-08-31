import { Color } from '@core/utils/colors';

import { GraphPath } from '../graph/path.ts';
import { Graph } from '../graph/types.ts';
import { createPathThemer } from '../theme/path/createPathThemer.ts';
import { ExplainerHighlight } from './types.ts';

/**
 * lights up a route the reader is being told about, for as long as they are
 * hovering the words that name it. see {@link createPathThemer} for what gets
 * painted, and for when to pass a `color` rather than take the default.
 *
 * the sibling of {@link createEdgeSetHighlight}, which is for a set of edges
 * that are interesting together without making a trip: every edge leaving a
 * node has no route through it to paint
 */
export const createPathHighlight = (
  graph: Graph,
  path: GraphPath,
  tooltipLabel?: ExplainerHighlight['tooltipLabel'],
  color?: Color,
): ExplainerHighlight => {
  const { themer } = createPathThemer(graph, { path, color });

  return {
    tooltipLabel,
    activate: () => themer.activate(),
    deactivate: () => themer.deactivate(),
  };
};
