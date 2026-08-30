import { CoreNode } from '@graph/primitives/types';
import { GNode, Graph } from '@magic/shared/graph';
import { Themer } from '@magic/shared/theme';
import Fraction from 'fraction.js';

import { ComputedRef } from 'vue';

/** labels every state with the share of its steps the chain spends there */
export const stationaryDistributionThemer = (
  graph: Graph,
  stationaryDistribution: ComputedRef<Map<GNode['id'], Fraction> | undefined>,
): Themer => {
  const shareText = ({ id }: CoreNode) =>
    stationaryDistribution.value?.get(id)?.toFraction();

  return graph.theme.createThemer({
    surface: {
      'node.default.text.content': shareText,
    },
  });
};
