import { mdiGestureDoubleTap, mdiHelp, mdiPencil } from '@mdi/js';

import {
  ICON_COLOR,
  OnboardingItem,
  mdiImageUrl,
} from '../onboarding/index.ts';

/** what the graph shell contributes when the product names nothing of its own */
export const GRAPH_ONBOARDING: OnboardingItem[] = [
  {
    imageUrl: mdiImageUrl(mdiGestureDoubleTap, ICON_COLOR),
    display: 'Double click to add a node',
  },
  {
    imageUrl: mdiImageUrl(mdiPencil, ICON_COLOR),
    display: 'A for freehand annotations',
  },
  {
    imageUrl: mdiImageUrl(mdiHelp, ICON_COLOR),
    display: 'H for help',
  },
];
