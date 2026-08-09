import { type Ref, computed } from 'vue';

import type { Overlap, Section, SetDefinition } from '../../types.ts';
import { OUTSIDE_ALL_SETS } from '../other/constants.ts';

/**
 * all individual sections of the set space
 */
export const useAllSections = (
  definitions: Ref<SetDefinition[]>,
  overlaps: Ref<Overlap[]>,
) => {
  return computed<Section[]>(() => {
    const overlappingSections = overlaps.value.map((overlap) => overlap.sets);
    const setsByThemselves = definitions.value.map(({ id }) => [id]);

    return [
      ...overlappingSections,
      ...setsByThemselves,
      [OUTSIDE_ALL_SETS.identity],
    ];
  });
};
