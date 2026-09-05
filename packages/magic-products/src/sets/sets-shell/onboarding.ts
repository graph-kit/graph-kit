import { Onboarding, SHARED_ONBOARDING_ITEMS } from '@magic/shared/onboarding';
import { mdiGestureDoubleTap } from '@mdi/js';

/** what sets suggests trying first, shown over a canvas with no sets on it */
export const SETS_ONBOARDING: Onboarding = {
  id: 'sets',
  items: [
    {
      icon: mdiGestureDoubleTap,
      display: 'Double click to create a set',
    },
    ...SHARED_ONBOARDING_ITEMS,
  ],
};
