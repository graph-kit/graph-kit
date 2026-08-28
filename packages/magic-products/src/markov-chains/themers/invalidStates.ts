import colors from '@core/utils/colors';
import { CoreNode } from '@graph/primitives/types';
import { GNode, Graph } from '@magic/shared/graph';
import { Themer, createNodeThemer } from '@magic/shared/theme';

import { ComputedRef } from 'vue';

/** paints every state whose transitions do not add up to a whole probability */
export const invalidStatesThemer = (
  graph: Graph,
  invalidStates: ComputedRef<Set<GNode['id']>>,
): Themer =>
  createNodeThemer(graph, ({ id }: CoreNode) =>
    invalidStates.value.has(id) ? colors.RED_500 : undefined,
  );
