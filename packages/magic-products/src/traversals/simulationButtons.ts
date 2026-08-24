import { nullThrows } from '@core/utils/assert';
import { GraphSimulationButtonOption } from '@magic/shared/graph-shell';
import { useFocusedNode } from '@magic/shared/utilities';

import { useTraversalSimulations } from './simulations/index.ts';

export const simulationButtons: GraphSimulationButtonOption = (graph) => {
  const { bfs, dfs, startNodeId } = useTraversalSimulations(graph);

  const node = useFocusedNode(graph);

  const disabled = () => !node.value && 'Click a node to set a starting point';

  const beforeStarting = () => {
    startNodeId.value = nullThrows(node.value?.id, 'no start node');
  };

  return [
    { definition: bfs, beforeStarting, disabled },
    { definition: dfs, beforeStarting, disabled },
  ];
};
