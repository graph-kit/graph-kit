import { GraphSimulationButtonOption } from '@magic/shared/graph-product';
import { useFocusedNode } from '@magic/shared/utilities';

import { watch } from 'vue';

import { usePathFindingSimulations } from './simulations/index.ts';

export const simulationButtons: GraphSimulationButtonOption = (graph) => {
  const { dijkstras, bellmanFord, floydWarshall, sourceNodeId } =
    usePathFindingSimulations(graph);

  const node = useFocusedNode(graph);

  watch(node, (newFocusedNode) => {
    sourceNodeId.value = newFocusedNode?.id;
  });

  const noNodes = () => graph.nodes.value.length === 0;

  const disabled = () => {
    if (noNodes()) return 'No nodes in graph';
    if (!sourceNodeId.value) return 'Click a node to start from';
    return false;
  };

  return [
    { definition: dijkstras, disabled },
    { definition: bellmanFord, disabled },
    {
      definition: floydWarshall,
      disabled: () => noNodes() && 'No nodes in graph',
    },
  ];
};
