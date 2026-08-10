import { type Ref, computed } from 'vue';

import type { Section, SetDefinition } from '../../types.ts';
import { OUTSIDE_ALL_SETS } from '../other/constants.ts';

/**
 * all individual sections of the set space
 */
export const useAllSections = (
  definitions: Ref<SetDefinition[]>,
  sharedSections: Ref<Section[]>,
) => {
  return computed<Section[]>(() => {
    const setsByThemselves = definitions.value.map(({ id }) => [id]);

    return [
      ...sharedSections.value,
      ...setsByThemselves,
      [OUTSIDE_ALL_SETS.identity],
    ];
  });
};
