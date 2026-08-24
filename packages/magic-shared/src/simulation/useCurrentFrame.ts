import { computed } from 'vue';

import { useProvidedShell } from '../product/context.ts';

export const useCurrentFrame = <Frame = any>() => {
  const shell = useProvidedShell();

  return computed(() => {
    const simulation = shell.simulation.current.value;
    if (!simulation) return;
    return simulation.frames[simulation.playhead.position];
  });
};
