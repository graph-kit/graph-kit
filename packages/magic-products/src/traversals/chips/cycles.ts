import { Graph } from '@magic/shared/graph';
import { createNodeThemer, nodeRoleColors } from '@magic/shared/theme';
import { LensChipDefinition } from '@magic/shared/ui/lens-chips/types';

import { computed } from 'vue';

/** the reason both searches carry a visited list, made visible */
export const cyclesChip = (graph: Graph): LensChipDefinition => {
  const cycles = computed(() => graph.characteristics.cycles.value);

  const onACycle = computed(() => cycles.value.nodeIdToCycle);
  const cycleCount = computed(() => cycles.value.cycles.length);

  const themer = createNodeThemer(graph, (node) =>
    onACycle.value.has(node.id) ? nodeRoleColors.result : undefined,
  );

  return {
    name: () => `Cycles: ${cycleCount.value}`,
    tooltipLabel: () =>
      cycleCount.value === 0
        ? 'No loops, so following edges can never bring a search back to a node it already left.'
        : 'These nodes sit on a loop, so following edges can lead back to where it started. That is what the Visited list is for: without it a search would walk the same ring forever.',
    lens: {
      id: 'traversal-cycles',
      ...themer,
    },
  };
};
