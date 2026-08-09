import { type Ref, computed } from 'vue';

import type { Circle, Overlap } from '../../types.ts';
import { RESERVED_LABELS } from '../other/constants.ts';

/**
 * all individual sections of the set space
 */
export const useAllSections = (
  circles: Ref<Circle[]>,
  overlaps: Ref<Overlap[]>,
) => {
  return computed(() => {
    const overlapsWithNames = overlaps.value.map((o) => o.circles);
    const circlesByThemselves = circles.value
      .map((c) => c.label)
      .map((id) => [id]);

    return [
      ...overlapsWithNames,
      ...circlesByThemselves,
      ...RESERVED_LABELS.map((l) => [l]),
    ];
  });
};
