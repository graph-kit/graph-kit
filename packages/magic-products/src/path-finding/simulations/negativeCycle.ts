import { ExplainerHighlight } from '@magic/shared/explainer';
import { GEdge, Graph } from '@magic/shared/graph';
import { edgeRoleColors } from '@magic/shared/theme';

import { createEdgeSetHighlight } from './createEdgeSetHighlight.ts';

export const NEGATIVE_CYCLE_DEFINITION =
  'A cycle in which all edges sum to a negative value';

export const negativeCycle = (
  graph: Graph,
  loop?: readonly GEdge['id'][],
): ExplainerHighlight =>
  loop?.length
    ? createEdgeSetHighlight(
        graph,
        loop,
        NEGATIVE_CYCLE_DEFINITION,
        edgeRoleColors.violation,
      )
    : { tooltipLabel: NEGATIVE_CYCLE_DEFINITION };
