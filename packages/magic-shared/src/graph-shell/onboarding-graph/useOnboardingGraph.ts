import { ReadonlyEventHub, createEventHub } from '@core/events/createEventHub';

import { Shell } from '../../product/types.ts';
import OnboardingGraphBanner from './OnboardingGraphBanner.vue';
import { ONBOARDING_GRAPH_SLOT_ID } from './constants.ts';
import { provideOnboardingGraph } from './context.ts';
import {
  OnboardingGraphEventMap,
  createOnboardingGraphEventRegistry,
} from './events.ts';
import { OnboardingGraph } from './types.ts';

export type OnboardingGraphControls = {
  /** puts the banner up */
  offer: (shell: Shell) => void;
  events: ReadonlyEventHub<OnboardingGraphEventMap>;
};

/** offers to build the product's starting graph, for someone who opened it on nothing */
export const useOnboardingGraph = (
  onboardingGraph?: OnboardingGraph,
): OnboardingGraphControls | undefined => {
  if (!onboardingGraph) return;

  const events = createEventHub(createOnboardingGraphEventRegistry());

  provideOnboardingGraph({ onboardingGraph, events });

  return {
    offer: (shell) => {
      if (!shell.onboarding?.isActive.value) return;

      shell.componentSlots.add({
        id: ONBOARDING_GRAPH_SLOT_ID,
        component: OnboardingGraphBanner,
        position: 'top-middle',
      });
    },
    events,
  };
};
