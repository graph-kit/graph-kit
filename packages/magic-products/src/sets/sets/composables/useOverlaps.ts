import { type Ref, computed } from 'vue';

import type { Circle, Overlap } from '../../types.ts';
import { isOverlapping } from '../other/circleUtils.ts';

const getOverlapsArray = (circles: Circle[]) => {
  const overlaps: Overlap[] = [];
  let overlapId = 1;

  const populateOverlaps = (overlapGroup: Circle[] = [], startIndex = 0) => {
    if (overlapGroup.length > 1) {
      overlaps.push({
        circles: overlapGroup.map((c) => c.label),
        id: overlapId++,
      });
    }

    for (let i = startIndex; i < circles.length; i++) {
      let allOverlap = true;
      for (let j = 0; j < overlapGroup.length; j++) {
        if (!isOverlapping(overlapGroup[j], circles[i])) {
          allOverlap = false;
          break;
        }
      }

      if (allOverlap) {
        overlapGroup.push(circles[i]);
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
  return overlaps.toSorted((a, b) => a.circles.length - b.circles.length);
};

export const useOverlaps = (circles: Ref<Circle[]>) =>
  computed(() => {
    return getOverlapsArray(circles.value);
  });
