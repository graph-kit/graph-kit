import { nullThrows } from '@core/utils/assert';
import { GraphSimulationButtonOption } from '@magic/shared/graph-shell';
import { useFocusedNode } from '@magic/shared/utilities';

import { useTraversalSimulations } from './simulations/index.ts';

export const simulationButtons: GraphSimulationButtonOption = (graph) => {
  const { bfs, dfs, startNodeId } = useTraversalSimulations(graph);

  const node = useFocusedNode(graph);

  const disabled = () => {
    if (graph.nodes.value.length === 0) return { reason: 'Add a node first' };
    if (!node.value) return { reason: 'Click a node' };
    return false;
  };

  const beforeStarting = () => {
    startNodeId.value = nullThrows(node.value?.id, 'no start node');
  };

  return [
    {
      name: 'Breadth-First Search',
      definition: bfs,
      beforeStarting,
      disabled,
    },
    { name: 'Depth-First Search', definition: dfs, beforeStarting, disabled },
  ];
};
