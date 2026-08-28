import colors from '@core/utils/colors';
import { CoreNode } from '@graph/primitives/types';
import { GNode, Graph } from '@magic/shared/graph';
import { Themer, createNodeThemer } from '@magic/shared/theme';

import { ComputedRef } from 'vue';

/** paints every state the chain keeps coming back to */
export const recurrentStatesThemer = (
  graph: Graph,
  recurrentStates: ComputedRef<Set<GNode['id']>>,
): Themer =>
  createNodeThemer(graph, ({ id }: CoreNode) =>
    recurrentStates.value.has(id) ? colors.AMBER_500 : undefined,
  );
