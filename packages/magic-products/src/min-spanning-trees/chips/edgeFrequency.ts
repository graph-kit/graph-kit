import colors from '@core/utils/colors';
import { CoreEdge } from '@graph/primitives/types';
import { Graph } from '@magic/shared/graph';
import { LensChipDefinition } from '@magic/shared/ui/lens-chips/types';
import tinycolor from 'tinycolor2';

import { computed } from 'vue';

import EdgeFrequencyLegend from '../EdgeFrequencyLegend.vue';

const BASE_COLOR = colors.INDIGO_600;
const MIN_WIDTH = 4;
const MAX_WIDTH = 20;
const MIN_ALPHA = 0.25;
const MAX_ALPHA = 1;
const MAX_DARKEN = 18;

const linearInterpolate = (min: number, max: number, ratio: number) =>
  min + (max - min) * ratio;

export const frequencyColor = (ratio: number) =>
  tinycolor(BASE_COLOR)
    .darken(ratio * MAX_DARKEN)
    .setAlpha(linearInterpolate(MIN_ALPHA, MAX_ALPHA, ratio))
    .toHex8String();

const frequencyWidth = (ratio: number) =>
  linearInterpolate(MIN_WIDTH, MAX_WIDTH, ratio);

export const edgeFrequencyChip = (graph: Graph): LensChipDefinition => {
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

  const colorByFrequency = (edge: CoreEdge) => frequencyColor(ratioOf(edge.id));
  const widthByFrequency = (edge: CoreEdge) => frequencyWidth(ratioOf(edge.id));

  const hoverLabel = (edge: CoreEdge) => {
    const frequency = frequencyOf(edge.id);
    const inAllMsts = frequency === totalMsts.value;
    return inAllMsts
      ? `In all ${totalMsts.value} MSTs`
      : `In ${frequency}/${totalMsts.value} MSTs`;
  };

  const themer = graph.theme.createThemer({
    canvas: {
      'edge.default.color': colorByFrequency,
      'edge.default.width': widthByFrequency,
      'edge.hover.color': colorByFrequency,
      'edge.hover.width': widthByFrequency,
      'edge.hover.text.content': hoverLabel,
    },
  });

  return {
    title: 'Edge Frequency',
    tooltipLabel:
      'Shows how often each edge shows up across every possible minimum spanning tree.',
    lens: {
      id: 'edge-frequency',
      ...themer,
      components: [
        {
          component: EdgeFrequencyLegend,
          position: 'bottom-middle',
        },
      ],
    },
  };
};
