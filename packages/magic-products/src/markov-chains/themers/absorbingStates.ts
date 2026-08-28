import { CoreNode } from '@graph/primitives/types';
import { GNode, Graph } from '@magic/shared/graph';
import { Themer, createNodeThemer, nodeRoleColors } from '@magic/shared/theme';

import { ComputedRef } from 'vue';

/** paints every state the chain can enter but never leave */
export const absorbingStatesThemer = (
  graph: Graph,
  absorbingStates: ComputedRef<Set<GNode['id']>>,
): Themer =>
  createNodeThemer(graph, ({ id }: CoreNode) =>
    absorbingStates.value.has(id) ? nodeRoleColors.result : undefined,
  );
