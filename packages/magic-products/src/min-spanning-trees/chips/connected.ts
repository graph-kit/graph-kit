import { nullThrows } from '@core/utils/assert';
import colors from '@core/utils/colors';
import { Graph } from '@magic/shared/graph';
import { createNodeThemer } from '@magic/shared/theme';
import { LensChipDefinition } from '@magic/shared/ui/lens-chips/types';

import { computed } from 'vue';

const COLOR_LIST = [
  colors.AMBER_500,
  colors.RED_500,
  colors.BLUE_500,
  colors.GREEN_500,
  colors.PURPLE_500,
];

/*
  over the mst cap nothing is enumerated, but connectivity does not need an mst to
  answer: one component means one tree spans the graph
*/
export const useMstConnected = (graph: Graph) =>
  computed(() => {
    const result = graph.minimumSpanningTrees.all.value;
    return result.skipped
      ? graph.characteristics.connected.value.components.value.length === 1
      : result.connected;
  });

export const connectedChip = (graph: Graph): LensChipDefinition => {
  const components = computed(
    () => graph.characteristics.connected.value.components,
  );

  const mstConnected = useMstConnected(graph);

  const themer = createNodeThemer(graph, (node) => {
    const componentIndex = nullThrows(
      components.value.map.get(node.id),
      'node id not part of component',
    );
    return COLOR_LIST[componentIndex % COLOR_LIST.length];
  });

  const componentCount = computed(() => components.value.value.length);

  return {
    name: {
      headline: 'Connected',
      stat: () => (mstConnected.value ? 'Yes' : 'No'),
    },
    tooltipLabel: () =>
      mstConnected.value
        ? 'Every node can be reached from every other, so a single tree of edges spans the whole graph.'
        : `Your graph breaks into ${componentCount.value} components, shown here by color. A spanning tree has to reach every node, so no single tree covers all of them and each component gets its own.`,
    lens: {
      id: 'is-mst-connected',
      ...themer,
    },
  };
};
