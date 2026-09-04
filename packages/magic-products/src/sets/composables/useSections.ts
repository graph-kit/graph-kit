import { type Ref, computed } from 'vue';

import { isOverlapping } from '../circleUtils.ts';
import { OUTSIDE_ALL_SETS } from '../constants.ts';
import type { Section, SetDefinition } from '../types.ts';

/**
 * every section covered by more than one set, which is every group of two or more
 * circles that all intersect one another
 */
const getSharedSections = (definitions: SetDefinition[]) => {
  const sharedSections: Section[] = [];

  const populateSharedSections = (
    overlapGroup: SetDefinition[] = [],
    startIndex = 0,
  ) => {
    if (overlapGroup.length > 1) {
      sharedSections.push(overlapGroup.map((definition) => definition.id));
    }

    for (let i = startIndex; i < definitions.length; i++) {
      let allOverlap = true;
      for (let j = 0; j < overlapGroup.length; j++) {
        if (!isOverlapping(overlapGroup[j].display, definitions[i].display)) {
          allOverlap = false;
          break;
        }
      }

      if (allOverlap) {
        overlapGroup.push(definitions[i]);
        populateSharedSections(overlapGroup, i + 1);
        overlapGroup.pop();
      }
    }
  };

  populateSharedSections();
  return sharedSections;
};

/**
 * all individual sections of the set space
 */
export const useSections = (definitions: Ref<SetDefinition[]>) =>
  computed<Section[]>(() => [
    ...getSharedSections(definitions.value),
    ...definitions.value.map(({ id }) => [id]),
    [OUTSIDE_ALL_SETS.identity],
  ]);
