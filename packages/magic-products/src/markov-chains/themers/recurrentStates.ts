import { CoreNode } from '@graph/primitives/types';
import { GNode, Graph } from '@magic/shared/graph';
import { Themer, createNodeThemer, nodeRoleColors } from '@magic/shared/theme';

import { ComputedRef } from 'vue';

/** paints every state the chain keeps coming back to */
export const recurrentStatesThemer = (
  graph: Graph,
  recurrentStates: ComputedRef<Set<GNode['id']>>,
): Themer =>
  createNodeThemer(graph, ({ id }: CoreNode) =>
    recurrentStates.value.has(id) ? nodeRoleColors.settled : undefined,
  );
