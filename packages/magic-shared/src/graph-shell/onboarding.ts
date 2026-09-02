import { mdiGestureDoubleTap, mdiHelp, mdiPencil } from '@mdi/js';

import { OnboardingItem } from '../onboarding/index.ts';

/** what the graph shell contributes when the product names nothing of its own */
export const GRAPH_ONBOARDING: OnboardingItem[] = [
  {
    icon: mdiGestureDoubleTap,
    display: 'Double click to add a node',
  },
  {
    icon: mdiPencil,
    display: 'A for freehand annotations',
  },
  {
    icon: mdiHelp,
    display: 'H for help',
  },
];
