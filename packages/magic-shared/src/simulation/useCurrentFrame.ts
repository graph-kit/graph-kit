import { computed } from 'vue';

import { useProvidedMagic } from '../product/context.ts';

export const useCurrentFrame = <Frame = any>() => {
  const magic = useProvidedMagic();

  return computed(() => {
    const simulation = magic.simulation.current.value;
    if (!simulation) return;
    return simulation.frames[simulation.playhead.position];
  });
};
