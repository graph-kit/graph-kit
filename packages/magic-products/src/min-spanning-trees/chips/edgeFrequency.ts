import { CoreEdge } from '@graph/primitives/types';
import { Graph } from '@magic/shared/graph';
import { LensChipDefinition } from '@magic/shared/ui/lens-chips/types';

import { computed } from 'vue';

import EdgeFrequencyDisplay from '../EdgeFrequencyDisplay.vue';

const MIN_WIDTH = 5;
const MAX_WIDTH = 30;

const linearInterpolate = (min: number, max: number, ratio: number) =>
  min + (max - min) * ratio;

export const frequencyWidth = (ratio: number) =>
  linearInterpolate(MIN_WIDTH, MAX_WIDTH, ratio);

export const useEdgeFrequency = (graph: Graph) => {
  const msts = computed(() => {
    const result = graph.minimumSpanningTrees.all.value;
    return result.skipped ? [] : result.msts;
  });
  const totalMsts = computed(() => msts.value.length);

  const frequencyByEdgeId = computed(() => {
    const counts = new Map<string, number>();
    for (const mst of msts.value) {
      for (const edge of mst) {
        counts.set(edge.id, (counts.get(edge.id) ?? 0) + 1);
      }
    }
    return counts;
  });

  const frequencyOf = (edgeId: string) =>
    frequencyByEdgeId.value.get(edgeId) ?? 0;

  const ratioOf = (edgeId: string) =>
    totalMsts.value === 0 ? 0 : frequencyOf(edgeId) / totalMsts.value;

  return { totalMsts, frequencyOf, ratioOf };
};

export const edgeFrequencyChip = (graph: Graph): LensChipDefinition => {
  const { ratioOf } = useEdgeFrequency(graph);

  const widthByFrequency = (edge: CoreEdge) => frequencyWidth(ratioOf(edge.id));

  const themer = graph.theme.createThemer({
    surface: {
      'edge.default.width': widthByFrequency,
      'edge.hover.width': widthByFrequency,
    },
    focus: {
      'edge.focus.width': widthByFrequency,
    },
  });

  return {
    name: 'Edge Frequency',
    tooltipLabel:
      'How often each edge shows up across every possible minimum spanning tree',
    lens: {
      id: 'edge-frequency',
      ...themer,
      components: [
        {
          component: EdgeFrequencyDisplay,
          position: 'center-left',
        },
      ],
    },
  };
};
