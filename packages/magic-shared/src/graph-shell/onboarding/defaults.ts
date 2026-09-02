import { mdiGestureDoubleTap, mdiHelp, mdiPencil } from '@mdi/js';

import { mdiImageUrl } from './icon.ts';
import { ICON_COLOR } from './palette.ts';
import { OnboardingItem } from './types.ts';

export const SHARED_ONBOARDING: OnboardingItem[] = [
  {
    imageUrl: mdiImageUrl(mdiPencil, ICON_COLOR),
    display: 'A for freehand annotations',
  },
  {
    imageUrl: mdiImageUrl(mdiHelp, ICON_COLOR),
    display: 'H for help',
  },
];

/** what any graph opens on, until the product says otherwise */
export const GRAPH_ONBOARDING: OnboardingItem[] = [
  {
    imageUrl: mdiImageUrl(mdiGestureDoubleTap, ICON_COLOR),
    display: 'Double click to add a node',
  },
  ...SHARED_ONBOARDING,
];
