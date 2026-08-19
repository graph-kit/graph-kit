import { Color } from '@core/utils/colors';
import { fractionIsInteger, fractionToDecimal } from '@core/utils/math';
import { CoreEdge } from '@graph/primitives/types';
import { Graph } from '@magic/shared/graph';
import { LensChipDefinition } from '@magic/shared/ui/lens-chips/types';
import Fraction from 'fraction.js';
import tinycolor from 'tinycolor2';

import { computed } from 'vue';

import MSTCost from '../MSTCost.vue';

export const totalCostChip = (graph: Graph): LensChipDefinition => {
  const result = computed(() => graph.minimumSpanningTrees.all.value);
  const msts = computed(() => {
    const value = result.value;
    return value.skipped ? [] : value.msts;
  });
  const totalMstCost = computed(() => {
    const value = result.value;
    return value.skipped ? new Fraction(0) : value.totalWeight;
  });

  const colorMstEdge = (edge: CoreEdge, resolveUnderneath: () => Color) => {
    const mst = msts.value.at(0);
    if (!mst) return;
    const inMst = mst.some((e) => e.id === edge.id);
    if (inMst) return;
    return tinycolor(resolveUnderneath()).setAlpha(0.25).toHex8String();
  };

  const themer = graph.theme.createThemer({
    canvas: {
      'edge.default.color': colorMstEdge,
      'edge.default.text.color': colorMstEdge,
      'edge.hover.color': colorMstEdge,
      'edge.hover.text.color': colorMstEdge,
    },
    focus: {
      'edge.focus.color': colorMstEdge,
      'edge.focus.text.color': colorMstEdge,
    },
  });

  const costExplanation =
    'The total cost if you sum up all the edges making up the minimum spanning tree.';

  return {
    name: () => `Total Cost: ${totalMstCost.value.toFraction()}`,
    tooltipLabel: () =>
      fractionIsInteger(totalMstCost.value)
        ? costExplanation
        : `${fractionToDecimal(totalMstCost.value)}: ${costExplanation}`,
    lens: {
      id: 'total-mst-cost',
      ...themer,
      components: [
        {
          component: MSTCost,
          position: 'bottom-middle',
        },
      ],
    },
  };
};
