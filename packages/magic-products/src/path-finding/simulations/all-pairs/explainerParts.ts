import { displayNumber } from '@core/utils/math';
import {
  ExplainerHighlight,
  createPathHighlight,
} from '@magic/shared/explainer';
import { Graph, GraphPath } from '@magic/shared/graph';
import { edgeRoleColors } from '@magic/shared/theme';
import Fraction from 'fraction.js';

const NEGATIVE_CYCLE = 'A cycle in which all edges sum to a negative value';

/** a cost that lights its route up on hover, or a plain number when it has none */
export const cost = (graph: Graph, value: Fraction, route: GraphPath) => {
  const { primary, secondary } = displayNumber(value);

  if (route.length === 0) {
    return { text: `<${primary}>`, highlights: [] as ExplainerHighlight[] };
  }

  return {
    text: `[${primary}]`,
    highlights: [createPathHighlight(graph, route, secondary)],
  };
};

/** `1 edge`, `9 edges`, `2 passes` */
export const count = (
  amount: number,
  singular: string,
  plural = `${singular}s`,
) => `${amount} ${amount === 1 ? singular : plural}`;

/** defines the term, and lights the loop up in its canvas violet once one is found */
export const negativeCycle = (
  graph: Graph,
  loop?: GraphPath,
): ExplainerHighlight =>
  loop?.length
    ? createPathHighlight(graph, loop, NEGATIVE_CYCLE, edgeRoleColors.result)
    : { tooltipLabel: NEGATIVE_CYCLE };
