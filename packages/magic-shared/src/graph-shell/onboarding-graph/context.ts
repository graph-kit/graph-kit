import { nullThrows } from '@core/utils/assert';

import { inject, provide } from 'vue';

import { OnboardingGraphControls } from './types.ts';

const ONBOARDING_GRAPH_KEY = 'ONBOARDING_GRAPH';

export const provideOnboardingGraph = (controls: OnboardingGraphControls) => {
  provide(ONBOARDING_GRAPH_KEY, controls);
};

export const useProvidedOnboardingGraph = () => {
  return nullThrows(
    inject<OnboardingGraphControls>(ONBOARDING_GRAPH_KEY),
    'onboarding graph not provided!',
  );
};
