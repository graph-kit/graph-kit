import { nullThrows } from '@core/utils/assert';
import { GraphSimulationButtonOption } from '@magic/shared/graph-shell';
import { useFocusedNode } from '@magic/shared/utilities';

import {
  useKruskalsSimulation,
  usePrimsSimulation,
} from './simulations/index.ts';

export const simulationButtons: GraphSimulationButtonOption = (graph) => {
  const { prims, startNodeId } = usePrimsSimulation(graph);
  const { kruskals } = useKruskalsSimulation(graph);

  const node = useFocusedNode(graph);

  const noNodes = () => graph.nodes.value.length === 0;

  return [
    {
      definition: prims,
      beforeStarting: () => {
        startNodeId.value = nullThrows(node.value?.id, 'no start node');
      },
      disabled: () => {
        if (noNodes()) return 'No nodes in graph';
        if (!node.value) return 'Click a node to start from';
        return false;
      },
    },
    { definition: kruskals, disabled: () => noNodes() && 'No nodes in graph' },
  ];
};
