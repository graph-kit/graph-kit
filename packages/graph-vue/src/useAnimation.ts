import { AnimationControls } from '@graph/plugins/animation/types';

import { computed } from 'vue';

import { useSignal } from './utils/useSignal.ts';

export const useAnimation = (animation: AnimationControls) => {
  const duration = useSignal(animation.duration);

  return {
    ...animation,
    duration: computed({
      get: () => duration.value,
      set: animation.setDuration,
    }),
  };
};
