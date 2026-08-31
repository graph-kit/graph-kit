import {
  ExplainerHighlight,
  createEdgeSetHighlight,
} from '@magic/shared/explainer';
import { GEdge, Graph } from '@magic/shared/graph';
import { edgeRoleColors } from '@magic/shared/theme';

const DEFINITION = 'A cycle in which all edges sum to a negative value';
export const negativeCycle = (
  graph: Graph,
  loop?: readonly GEdge['id'][],
): ExplainerHighlight =>
  loop?.length
    ? createEdgeSetHighlight(graph, loop, DEFINITION, edgeRoleColors.result)
    : { tooltipLabel: DEFINITION };
