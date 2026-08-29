import colors, { Color } from '@core/utils/colors';
import { CoreNode } from '@graph/primitives/types';
import { GNode, Graph } from '@magic/shared/graph';
import { Themer } from '@magic/shared/theme';
import Fraction from 'fraction.js';
import tinycolor from 'tinycolor2';

import { ComputedRef, Ref } from 'vue';

const NEAREST_HUNDREDTH = 0.01;
const PERCENT = 100;

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

  const chanceColor = ({ id }: CoreNode, resolveUnderneath: () => Color) => {
    const probability = distribution.value?.get(id);
    if (probability === undefined) return;
    return tinycolor
      .mix(resolveUnderneath(), colors.RED_600, probability.valueOf() * PERCENT)
      .toHexString();
  };

  return graph.theme.createThemer({
    surface: {
      'node.default.text.content': chanceText,
      'node.hover.text.content': chanceText,
      'node.default.border.color': chanceColor,
      'node.hover.border.color': chanceColor,
    },
  });
};
