import colors from '@core/utils/colors';
import { CoreNode } from '@graph/primitives/types';
import { GNode, Graph } from '@magic/shared/graph';
import { Themer, createNodeThemer } from '@magic/shared/theme';

import { ComputedRef } from 'vue';

/** paints every state the chain passes through and eventually leaves for good */
export const transientStatesThemer = (
  graph: Graph,
  transientStates: ComputedRef<Set<GNode['id']>>,
): Themer =>
  createNodeThemer(graph, ({ id }: CoreNode) =>
    transientStates.value.has(id) ? colors.AMBER_500 : undefined,
  );
