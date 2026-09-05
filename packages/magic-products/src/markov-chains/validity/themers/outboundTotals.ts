import { CoreNode } from '@graph/primitives/types';
import { GNode, Graph } from '@magic/shared/graph';
import { Themer } from '@magic/shared/theme';
import Fraction from 'fraction.js';

import { ComputedRef } from 'vue';

/** labels every state with what its transitions add up to, which has to be 1 */
export const outboundTotalsThemer = (
  graph: Graph,
  outboundTotals: ComputedRef<Map<GNode['id'], Fraction>>,
  invalidStates: ComputedRef<Set<GNode['id']>>,
): Themer => {
  const totalText = ({ id }: CoreNode) => {
    if (invalidStates.value.size === 0) return;
    return outboundTotals.value.get(id)?.toFraction();
  };

  return graph.theme.createThemer({
    surface: {
      'node.default.text.content': totalText,
    },
    focus: {
      'node.focus.text.content': totalText,
    },
  });
};
