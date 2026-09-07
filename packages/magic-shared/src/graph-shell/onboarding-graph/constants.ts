import { OnboardingGraphOptions } from './types.ts';

export const ONBOARDING_GRAPH_SLOT_ID = 'graph-shell/onboarding-graph';

export const DEFAULT_ONBOARDING_GRAPH_OPTIONS: OnboardingGraphOptions = {
  buildButtonText: 'Build Me A Graph',
};

/** slow enough that the graph reads as being drawn rather than appearing */
export const BUILD_DURATION_MS = 300;
