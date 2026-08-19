import { GraphSimulationButtonOption } from '@magic/shared/graph-product';
import { useFocusedNode } from '@magic/shared/utilities';

import { watch } from 'vue';

import {
  useKruskalsSimulation,
  usePrimsSimulation,
} from './simulations/index.ts';

export const simulationButtons: GraphSimulationButtonOption = (graph) => {
  const { prims, startNodeId } = usePrimsSimulation(graph);
  const { kruskals } = useKruskalsSimulation(graph);

  const node = useFocusedNode(graph);

  watch(node, (newFocusedNode) => {
    startNodeId.value = newFocusedNode?.id;
  });

  const noNodes = () => graph.nodes.value.length === 0;

  return [
    {
      definition: prims,
      disabled: () => {
        if (noNodes()) return 'No nodes in graph';
        if (!startNodeId.value) return 'Click a node to start from';
        return false;
      },
    },
    { definition: kruskals, disabled: () => noNodes() && 'No nodes in graph' },
  ];
};
