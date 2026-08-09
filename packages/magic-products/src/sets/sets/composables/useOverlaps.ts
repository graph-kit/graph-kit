import { type Ref, computed } from 'vue';

import type { Overlap, SetDefinition } from '../../types.ts';
import { isOverlapping } from '../other/circleUtils.ts';

const getOverlapsArray = (definitions: SetDefinition[]) => {
  const overlaps: Overlap[] = [];
  let overlapId = 1;

  const populateOverlaps = (
    overlapGroup: SetDefinition[] = [],
    startIndex = 0,
  ) => {
    if (overlapGroup.length > 1) {
      overlaps.push({
        sets: overlapGroup.map((definition) => definition.id),
        id: overlapId++,
      });
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
        populateOverlaps(overlapGroup, i + 1);
        overlapGroup.pop();
      }
    }
  };

  populateOverlaps();
  /*
    IMPORTANT: if you want regions that exclude others, render order matters. if you want
    something union with something but excluding something else, put it behind those and have the stuff render on top of it.
  */
  return overlaps.toSorted((a, b) => a.sets.length - b.sets.length);
};

export const useOverlaps = (definitions: Ref<SetDefinition[]>) =>
  computed(() => {
    return getOverlapsArray(definitions.value);
  });
