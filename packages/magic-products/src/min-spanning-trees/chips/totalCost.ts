import { Color } from '@core/utils/colors';
import { displayNumber } from '@core/utils/math';
import { CoreEdge } from '@graph/primitives/types';
import { Graph } from '@magic/shared/graph';
import { LensChipDefinition } from '@magic/shared/ui/lens-chips/types';
import tinycolor from 'tinycolor2';

import { computed } from 'vue';

import MSTCost from '../MSTCost.vue';
import { useMstConnected } from './connected.ts';

export const totalCostChip = (graph: Graph): LensChipDefinition => {
  const mst = computed(() => graph.minimumSpanningTrees.one.value);

  const colorMstEdge = (edge: CoreEdge, resolveUnderneath: () => Color) => {
    const inMst = mst.value.edges.some((edgeId) => edgeId === edge.id);
    if (inMst) return;
    return tinycolor(resolveUnderneath()).setAlpha(0.25).toHex8String();
  };

  const themer = graph.theme.createThemer({
    surface: {
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

  const displayCost = computed(() => displayNumber(mst.value.cost));

  const mstConnected = useMstConnected(graph);

  const costExplanation = () =>
    mstConnected.value
      ? 'The total cost if you sum up all the edges making up the minimum spanning tree.'
      : 'The total cost if you sum up all the edges making up the minimum spanning forest, one tree per component.';

  return {
    name: {
      headline: 'Total Cost',
      stat: () => displayCost.value.primary,
    },
    tooltipLabel: costExplanation,
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
