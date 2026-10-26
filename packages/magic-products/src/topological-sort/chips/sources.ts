import { Graph } from '@magic/shared/graph';
import { createNodeThemer, nodeRoleColors } from '@magic/shared/theme';
import { LensChipDefinition } from '@magic/shared/ui/lens-chips/types';

import { computed } from 'vue';

import { useInDegrees } from '../useInDegrees.ts';

export const sourcesChip = (graph: Graph): LensChipDefinition => {
  const inDegrees = useInDegrees(graph);

  const sourceIds = computed(
    () =>
      new Set(
        [...inDegrees.value]
          .filter(([, inDegree]) => inDegree === 0)
          .map(([nodeId]) => nodeId),
      ),
  );

  const themer = createNodeThemer(graph, (node) =>
    sourceIds.value.has(node.id) ? nodeRoleColors.pending : undefined,
  );

  return {
    label: {
      term: 'Sources',
      value: () => sourceIds.value.size,
    },
    tooltipLabel: () => {
      if (sourceIds.value.size === 0) {
        return "Every node has an edge pointing into it, which only a cycle can cause, so Kahn's algorithm has nowhere to start.";
      }
      return "Nodes nothing points to. Kahn's algorithm starts from these, since nothing has to come before them.";
    },
    lens: {
      id: 'sources',
      ...themer,
    },
  };
};
