import { Graph } from '@magic/shared/graph';
import {
  createEdgeThemer,
  createNodeThemer,
  edgeRoleColors,
  nodeRoleColors,
} from '@magic/shared/theme';
import { LensChipDefinition } from '@magic/shared/ui/lens-chips/types';

import { computed } from 'vue';

export const acyclicChip = (graph: Graph): LensChipDefinition => {
  const cycles = computed(() => graph.characteristics.cycles.value);
  const cycleOfNode = computed(() => cycles.value.nodeIdToCycle);

  const nodeThemer = createNodeThemer(graph, (node) =>
    cycleOfNode.value.has(node.id) ? nodeRoleColors.violation : undefined,
  );

  const edgeThemer = createEdgeThemer(graph, ({ source, target }) => {
    const cycle = cycleOfNode.value.get(source);
    if (cycle === undefined || cycle !== cycleOfNode.value.get(target)) return;
    return edgeRoleColors.violation;
  });

  return {
    label: {
      term: 'Acyclic',
      value: () => (cycles.value.isAcyclic ? 'Yes' : 'No'),
    },
    tooltipLabel: 'Does a group of nodes form a cycle?',
    lens: {
      id: 'acyclic',
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
