import { CoreNode } from '@graph/primitives/types';
import { GNode, Graph } from '@magic/shared/graph';
import { Themer } from '@magic/shared/theme';
import Fraction from 'fraction.js';

import { ComputedRef } from 'vue';

/** labels every state with the chance the chain is sitting on it right now */
export const distributionThemer = (
  graph: Graph,
  distribution: ComputedRef<Map<GNode['id'], Fraction> | undefined>,
): Themer => {
  const chanceText = ({ id }: CoreNode) => {
    const probability = distribution.value?.get(id);
    if (probability === undefined) return;
    return probability.toFraction();
  };

  return graph.theme.createThemer({
    surface: {
      'node.default.text.content': chanceText,
      'node.hover.text.content': chanceText,
    },
  });
};
