import {
  ICON_COLOR,
  OnboardingItem,
  mdiImageUrl,
} from '@magic/shared/onboarding';
import { mdiGestureDoubleTap, mdiHelp } from '@mdi/js';

/** what sets suggests trying first, shown over a canvas with no sets on it */
export const SETS_ONBOARDING: OnboardingItem[] = [
  {
    imageUrl: mdiImageUrl(mdiGestureDoubleTap, ICON_COLOR),
    display: 'Double click to create a set',
  },
  {
    imageUrl: mdiImageUrl(mdiHelp, ICON_COLOR),
    display: 'H for help',
  },
];
