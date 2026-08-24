import { nullThrows } from '@core/utils/assert';

import { computed } from 'vue';

import { useProvidedShell } from '../product/context.ts';
import { useCurrentFrame } from './useCurrentFrame.ts';

export const useRunningSimulation = () => {
  const shell = useProvidedShell();

  const simulation = computed(() =>
    nullThrows(
      shell.simulation.current.value,
      'no actively running simulation!',
    ),
  );

  const violation = computed(() => simulation.value.violation);

  const currentFrame = useCurrentFrame();
  const explainer = computed(() =>
    simulation.value.explainer?.(currentFrame.value),
  );

  return {
    simulation,
    violation,
    explainer,
  };
};
