import { EventHub } from '@core/events/createEventHub';
import { nullThrows } from '@core/utils/assert';

import { inject, provide } from 'vue';

import { OnboardingGraphEventMap } from './events.ts';
import { OnboardingGraph } from './types.ts';

const ONBOARDING_GRAPH_KEY = 'ONBOARDING_GRAPH';

/** what the banner needs: the graph to build, and the hub to announce it on */
export type ProvidedOnboardingGraph = {
  onboardingGraph: OnboardingGraph;
  events: EventHub<OnboardingGraphEventMap>;
};

export const provideOnboardingGraph = (provided: ProvidedOnboardingGraph) => {
  provide(ONBOARDING_GRAPH_KEY, provided);
};

export const useProvidedOnboardingGraph = () => {
  return nullThrows(
    inject<ProvidedOnboardingGraph>(ONBOARDING_GRAPH_KEY),
    'onboarding graph not provided!',
  );
};
