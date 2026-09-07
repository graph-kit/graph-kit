import { EventMapToEventRegistry } from '@core/events/types';

export type OnboardingGraphEventMap = {
  /** the starting graph was built, replacing whatever the canvas was holding */
  onOnboardingGraphBuilt: () => void;
};

type OnboardingGraphEventRegistry =
  EventMapToEventRegistry<OnboardingGraphEventMap>;

export const createOnboardingGraphEventRegistry =
  (): OnboardingGraphEventRegistry => ({
    onOnboardingGraphBuilt: new Set(),
  });
