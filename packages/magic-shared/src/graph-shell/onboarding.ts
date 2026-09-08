import { mdiBackspace, mdiGestureDoubleTap } from '@mdi/js';

import {
  OnboardingItem,
  SHARED_ONBOARDING_ITEMS,
} from '../onboarding/index.ts';

/** what the graph shell contributes when the product names nothing of its own */
export const GRAPH_ONBOARDING: OnboardingItem[] = [
  {
    icon: mdiGestureDoubleTap,
    display: 'Double click to add node',
  },
  {
    icon: mdiBackspace,
    display: 'Backspace to remove node/edge',
  },
  ...SHARED_ONBOARDING_ITEMS,
];
