import { EventMapToEventRegistry } from '@core/events/types';

export type OnboardingGraphEventMap = {
  /** the onboarding graph is about to be built */
  onBeforeOnboardingGraphBuilt: () => void;
  /** the onboarding graph was built, replacing whatever the canvas was holding */
  onOnboardingGraphBuilt: () => void;
};

type OnboardingGraphEventRegistry =
  EventMapToEventRegistry<OnboardingGraphEventMap>;

export const createOnboardingGraphEventRegistry =
  (): OnboardingGraphEventRegistry => ({
    onBeforeOnboardingGraphBuilt: new Set(),
    onOnboardingGraphBuilt: new Set(),
  });
