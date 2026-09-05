import colors from '@core/utils/colors';
import { CoreEdge } from '@graph/primitives/types';
import { Graph } from '@magic/shared/graph';
import { Themer, createEdgeThemer } from '@magic/shared/theme';

import { ComputedRef, computed } from 'vue';

import { Transition } from '../useChainValidity.ts';

/** paints every transition carrying a probability below zero */
export const negativeTransitionsThemer = (
  graph: Graph,
  negativeTransitions: ComputedRef<Transition[]>,
): Themer => {
  const negativeIds = computed(
    () => new Set(negativeTransitions.value.map((transition) => transition.id)),
  );

  return createEdgeThemer(graph, ({ id }: CoreEdge) =>
    negativeIds.value.has(id) ? colors.RED_600 : undefined,
  );
};
