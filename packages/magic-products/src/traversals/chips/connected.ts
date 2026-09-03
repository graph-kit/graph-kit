import { nullThrows } from '@core/utils/assert';
import colors from '@core/utils/colors';
import { Graph } from '@magic/shared/graph';
import { createNodeThemer } from '@magic/shared/theme';
import { LensChipDefinition } from '@magic/shared/ui/lens-chips/types';

import { computed } from 'vue';

const ISLAND_COLORS = [
  colors.AMBER_500,
  colors.BLUE_500,
  colors.EMERALD_500,
  colors.VIOLET_500,
  colors.PINK_500,
];

export const connectedChip = (graph: Graph): LensChipDefinition => {
  const components = computed(
    () => graph.characteristics.connected.value.components,
  );

  const islandCount = computed(() => components.value.value.length);
  const isConnected = computed(() => islandCount.value < 2);

  const themer = createNodeThemer(graph, (node) => {
    if (isConnected.value) return;
    const islandIndex = nullThrows(
      components.value.map.get(node.id),
      'node id not part of an island',
    );
    return ISLAND_COLORS[islandIndex % ISLAND_COLORS.length];
  });

  return {
    name: () => `Connected: ${isConnected.value ? 'Yes' : 'No'}`,
    tooltipLabel: () =>
      isConnected.value
        ? 'Every node is joined to the rest by some chain of edges.'
        : `The graph falls into ${islandCount.value} islands with no edges between them at all.`,
    lens: {
      id: 'traversal-connected',
      ...themer,
    },
  };
};
