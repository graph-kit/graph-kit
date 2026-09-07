import { Shell } from '../../product/types.ts';
import OnboardingGraphBanner from './OnboardingGraphBanner.vue';
import { ONBOARDING_GRAPH_SLOT_ID } from './constants.ts';
import { provideOnboardingGraph } from './context.ts';
import { OnboardingGraph } from './types.ts';

/** offers to build the product's starting graph, for someone who opened it on nothing */
export const useOnboardingGraph = (onboardingGraph?: OnboardingGraph) => {
  if (!onboardingGraph) return;

  provideOnboardingGraph(onboardingGraph);

  return (shell: Shell) => {
    if (!shell.onboarding?.isActive.value) return;

    shell.componentSlots.add({
      id: ONBOARDING_GRAPH_SLOT_ID,
      component: OnboardingGraphBanner,
      position: 'top-middle',
    });
  };
};
