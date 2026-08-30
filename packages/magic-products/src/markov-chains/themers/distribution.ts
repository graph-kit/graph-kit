import { CoreNode } from '@graph/primitives/types';
import { GNode, Graph } from '@magic/shared/graph';
import { Themer } from '@magic/shared/theme';
import Fraction from 'fraction.js';

import { ComputedRef, Ref } from 'vue';

const NEAREST_HUNDREDTH = 0.01;

/** labels every state with the chance the chain is sitting on it right now */
export const distributionThemer = (
  graph: Graph,
  distribution: ComputedRef<Map<GNode['id'], Fraction> | undefined>,
  simplify: Ref<boolean>,
): Themer => {
  const chanceText = ({ id }: CoreNode) => {
    const probability = distribution.value?.get(id);
    if (probability === undefined) return;
    if (!simplify.value) return probability.toFraction();
    return probability.simplify(NEAREST_HUNDREDTH).toFraction();
  };

  return graph.theme.createThemer({
    surface: {
      'node.default.text.content': chanceText,
    },
  });
};
