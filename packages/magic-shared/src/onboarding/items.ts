import { mdiHelp, mdiPencil } from '@mdi/js';

import { TOGGLE_ANNOTATIONS_KEY } from '../shortcuts/useAnnotationsShortcuts.ts';
import { HELP_MENU_KEY } from '../ui/help-menu/useHelpMenuState.ts';
import { OnboardingItem } from './types.ts';

export const SHARED_ONBOARDING_ITEMS: OnboardingItem[] = [
  {
    icon: mdiPencil,
    display: `${TOGGLE_ANNOTATIONS_KEY.toUpperCase()} for freehand annotations`,
  },
  {
    icon: mdiHelp,
    display: `${HELP_MENU_KEY.toUpperCase()} for help`,
  },
];
