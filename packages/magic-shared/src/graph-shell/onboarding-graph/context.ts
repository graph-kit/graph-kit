import { nullThrows } from '@core/utils/assert';

import { inject, provide } from 'vue';

import { OnboardingGraph } from './types.ts';

const ONBOARDING_GRAPH_KEY = 'ONBOARDING_GRAPH';

export const provideOnboardingGraph = (onboardingGraph: OnboardingGraph) => {
  provide(ONBOARDING_GRAPH_KEY, onboardingGraph);
};

export const useProvidedOnboardingGraph = () => {
  return nullThrows(
    inject<OnboardingGraph>(ONBOARDING_GRAPH_KEY),
    'onboarding graph not provided!',
  );
};
