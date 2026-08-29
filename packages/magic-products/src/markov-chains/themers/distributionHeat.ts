import colors, { Color } from '@core/utils/colors';
import { CoreNode } from '@graph/primitives/types';
import { GNode, Graph } from '@magic/shared/graph';
import { Themer, createNodeThemer } from '@magic/shared/theme';
import Fraction from 'fraction.js';
import tinycolor from 'tinycolor2';

import { ComputedRef } from 'vue';

const PERCENT = 100;

/** reddens every state by how likely the chain is to be sitting on it right now */
export const distributionHeatThemer = (
  graph: Graph,
  distribution: ComputedRef<Map<GNode['id'], Fraction> | undefined>,
): Themer =>
  createNodeThemer(
    graph,
    ({ id }: CoreNode, resolveUnderneath: () => Color) => {
      const probability = distribution.value?.get(id);
      if (probability === undefined) return;
      return tinycolor
        .mix(
          resolveUnderneath(),
          colors.RED_600,
          probability.valueOf() * PERCENT,
        )
        .toHexString();
    },
  );
