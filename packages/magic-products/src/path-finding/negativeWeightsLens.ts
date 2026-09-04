import colors from '@core/utils/colors';
import { Graph } from '@magic/shared/graph';
import { Lens } from '@magic/shared/lens';
import { createEdgeThemer } from '@magic/shared/theme';

import { computed } from 'vue';

export const negativeWeightsLens = (graph: Graph): Lens => {
  const negativeEdgeIds = computed(
    () =>
      new Set(
        graph.edges.value
          .filter((edge) => edge.weight.lt(0))
          .map((edge) => edge.id),
      ),
  );

  const themer = createEdgeThemer(graph, (edge) =>
    negativeEdgeIds.value.has(edge.id) ? colors.RED_600 : undefined,
  );

  return {
    id: 'negative-weights',
    activate: () => themer.activate(),
    deactivate: () => themer.deactivate(),
  };
};
