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
    return false;
  };

  const beforeStarting = () => {
    sourceNodeId.value = nullThrows(node.value?.id, 'no source node');
  };

  const dijkstrasDisabled = () => {
    const shared = disabled();
    if (shared) return shared;
    if (!negativeWeightEdge(graph)) return false;
    return "Dijkstra's cannot run with a negative edge weight. Try Bellman-Ford";
  };

  return [
    { definition: dijkstras, beforeStarting, disabled: dijkstrasDisabled },
    { definition: bellmanFord, beforeStarting, disabled },
    {
      definition: floydWarshall,
      disabled: () => noNodes() && 'No nodes in graph',
    },
  ];
};
