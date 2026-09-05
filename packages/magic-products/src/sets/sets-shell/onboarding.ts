import { Onboarding } from '@magic/shared/onboarding';
import { mdiGestureDoubleTap, mdiHelp } from '@mdi/js';

export const SETS_ONBOARDING: Onboarding = {
  id: 'sets',
  items: [
    {
      icon: mdiGestureDoubleTap,
      display: 'Double click to create a set',
    },
    {
      icon: mdiHelp,
      display: 'H for help',
    },
  ],
};
