import { GNode } from '@magic/shared/graph';

import { ComputedRef, computed } from 'vue';

/** the class each state sits in, so a themer can reach a color by index */
export const useClassIndex = (classes: ComputedRef<Set<GNode['id']>[]>) =>
  computed(() => {
    const indices = new Map<GNode['id'], number>();

    for (const [index, stateClass] of classes.value.entries()) {
      for (const stateId of stateClass) indices.set(stateId, index);
    }

    return indices;
  });
