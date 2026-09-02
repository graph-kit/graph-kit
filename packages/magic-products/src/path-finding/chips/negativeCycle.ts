import { bellmanFord } from '@graph/algorithms/dynamic-programming';
import { Graph } from '@magic/shared/graph';
import {
  createEdgeThemer,
  createNodeThemer,
  edgeRoleColors,
  nodeRoleColors,
} from '@magic/shared/theme';
import { LensChipDefinition } from '@magic/shared/ui/lens-chips/types';

import { computed } from 'vue';

import { NEGATIVE_CYCLE_DEFINITION } from '../simulations/negativeCycle.ts';

const findNegativeCycle = (graph: Graph) => {
  for (const component of graph.characteristics.sccs.value.components) {
    const inComponent = new Set(component.map((node) => node.id));

    const edges = graph.edges.value.filter(
      (edge) => inComponent.has(edge.source) && inComponent.has(edge.target),
    );
    if (edges.length === 0) continue;

    const result = bellmanFord(component, edges, component[0].id);
    if (result.negativeCycle) return result.cycle;
  }
};

export const negativeCycleChip = (graph: Graph): LensChipDefinition => {
  const cycle = computed(() => findNegativeCycle(graph));

  const cycleNodeIds = computed(() => new Set(cycle.value?.nodes ?? []));
  const cycleEdgeIds = computed(() => new Set(cycle.value?.edges ?? []));

  const nodeThemer = createNodeThemer(graph, (node) =>
    cycleNodeIds.value.has(node.id) ? nodeRoleColors.violation : undefined,
  );

  const edgeThemer = createEdgeThemer(graph, (edge) =>
    cycleEdgeIds.value.has(edge.id) ? edgeRoleColors.violation : undefined,
  );

  return {
    name: () => `Negative Cycle: ${cycle.value ? 'Yes' : 'No'}`,
    tooltipLabel: `${NEGATIVE_CYCLE_DEFINITION}. Every lap around it costs less than the previous round causing infinitely short paths`,
    lens: {
      id: 'negative-cycle',
      activate: () => {
        nodeThemer.activate();
        edgeThemer.activate();
      },
      deactivate: () => {
        nodeThemer.deactivate();
        edgeThemer.deactivate();
      },
    },
  };
};
