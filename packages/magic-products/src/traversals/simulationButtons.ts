import { GraphSimulationButtonOption } from '@magic/shared/graph-product';
import { useFocusedNode } from '@magic/shared/utilities';

import { watch } from 'vue';

import { useTraversalSimulations } from './simulations/index.ts';

export const simulationButtons: GraphSimulationButtonOption = (graph) => {
  const { bfs, dfs, startNodeId } = useTraversalSimulations(graph);

  const node = useFocusedNode(graph);

  watch(node, (newFocusedNode) => {
    startNodeId.value = newFocusedNode?.id;
  });

  const disabled = () =>
    !startNodeId.value && 'Click a node to set a starting point';

  return [
    { definition: bfs, disabled },
    { definition: dfs, disabled },
  ];
};
