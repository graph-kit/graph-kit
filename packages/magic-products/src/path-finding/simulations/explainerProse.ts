import { displayNumber } from '@core/utils/math';
import {
  ExplainerHighlight,
  createEdgeSetHighlight,
} from '@magic/shared/explainer';
import { Graph, GraphPath } from '@magic/shared/graph';
import Fraction from 'fraction.js';

/** a cost that lights its route up on hover, or a plain number when it has none */
export const cost = (graph: Graph, value: Fraction, route: GraphPath) => {
  const { primary, secondary } = displayNumber(value);

  if (route.length === 0) {
    return { text: `<${primary}>`, highlights: [] as ExplainerHighlight[] };
  }

  return {
    text: `[${primary}]`,
    highlights: [createEdgeSetHighlight(graph, route, secondary)],
  };
};

/** `1 edge`, `9 edges`, `2 passes` */
export const count = (
  amount: number,
  singular: string,
  plural = `${singular}s`,
) => `${amount} ${amount === 1 ? singular : plural}`;

/** `a`, `a and b`, `a, b, and c` */
export const listOf = (items: readonly string[]) => {
  if (items.length <= 2) return items.join(' and ');
  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`;
};
