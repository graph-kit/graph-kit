import { GraphSimulationButtonOption } from '@magic/shared/graph-shell';

import { kahnsSimulation } from './simulations/kahns/index.ts';

export const simulationButtons: GraphSimulationButtonOption = (graph) => [
  {
    name: "Kahn's",
    definition: kahnsSimulation(graph),
    disabled: () =>
      graph.nodes.value.length === 0 && { reason: 'Add a node first' },
  },
];
