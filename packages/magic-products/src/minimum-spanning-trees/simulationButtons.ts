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
  const noEdges = () => graph.edges.value.length === 0;

  return [
    {
      name: "Prim's",
      definition: prims,
      beforeStarting: () => {
        startNodeId.value = nullThrows(node.value?.id, 'no start node');
      },
      disabled: () => {
        if (noNodes()) return { reason: 'Add a node' };
        if (noEdges()) return { reason: 'Add an edge' };
        if (!node.value) return { reason: 'Click a node to start from' };
        return false;
      },
    },
    {
      name: "Kruskal's",
      definition: kruskals,
      disabled: () => {
        if (noNodes()) return { reason: 'Add a node' };
        if (noEdges()) return { reason: 'Add an edge' };
        return false;
      },
    },
  ];
};
