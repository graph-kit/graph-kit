import { nullThrows } from '@core/utils/assert';
import colors from '@core/utils/colors';
import { Graph } from '@magic/shared/graph';
import { createNodeThemer } from '@magic/shared/theme';
import { LensChipDefinition } from '@magic/shared/ui/lens-chips/types';

import { computed } from 'vue';

const CYCLE_COLORS = [
  colors.VIOLET_500,
  colors.CYAN_500,
  colors.ORANGE_500,
  colors.LIME_500,
  colors.ROSE_500,
  colors.TEAL_500,
];

export const cyclesChip = (graph: Graph): LensChipDefinition => {
  const cycles = computed(() => graph.characteristics.cycles.value);

  const cycleOfNode = computed(() => cycles.value.nodeIdToCycle);
  const cycleCount = computed(() => cycles.value.cycles.length);

  const themer = createNodeThemer(graph, (node) => {
    if (!cycleOfNode.value.has(node.id)) return;
    const cycleIndex = nullThrows(
      cycleOfNode.value.get(node.id),
      'node id not part of a cycle',
    );
    return CYCLE_COLORS[cycleIndex % CYCLE_COLORS.length];
  });

  return {
    name: {
      headline: 'Cycles',
      stat: () => cycleCount.value,
    },
    tooltipLabel: () => {
      if (cycleCount.value === 0) {
        return 'No loops, so following edges can never bring a search back to a node it already left.';
      }
      return `Nodes that can reach themselves again.`;
    },
    lens: {
      id: 'traversal-cycles',
      ...themer,
    },
  };
};
