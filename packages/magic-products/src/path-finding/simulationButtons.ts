import { nullThrows } from '@core/utils/assert';
import { GraphSimulationButtonOption } from '@magic/shared/graph-shell';
import { useFocusedNode } from '@magic/shared/utilities';

import { negativeWeightEdge } from './simulations/arcs.ts';
import { usePathFindingSimulations } from './simulations/index.ts';

export const simulationButtons: GraphSimulationButtonOption = (graph) => {
  const { dijkstras, bellmanFord, floydWarshall, sourceNodeId } =
    usePathFindingSimulations(graph);

  const node = useFocusedNode(graph);

  const noNodes = () => graph.nodes.value.length === 0;

  const disabled = () => {
    if (noNodes()) return 'No nodes in graph';
    if (!node.value) return 'Click a node to start from';
    if (negativeWeightEdge(graph))
      return 'Cannot run with negative edge weights';
    return false;
  };

  const beforeStarting = () => {
    sourceNodeId.value = nullThrows(node.value?.id, 'no source node');
  };

  return [
    { definition: dijkstras, beforeStarting, disabled },
    { definition: bellmanFord, beforeStarting, disabled },
    {
      definition: floydWarshall,
      disabled: () => noNodes() && 'No nodes in graph',
    },
  ];
};
