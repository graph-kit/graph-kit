import { cn } from '@core/components/cn';

import { toggleIconButton } from '../../../components/toggle-icon-button/classes.ts';

/** every entry in the column occupies the same square, so the strip reads as one column of equal spots */
export const spotShape =
  'flex size-12 cursor-pointer items-center justify-center rounded-lg transition-colors';

/** the tools and pickers report their own state, so they sit on the panel's surface and let the pressed and expanded highlights be the only fill */
export const spot = cn(
  toggleIconButton,
  spotShape,
  'bg-transparent dark:bg-transparent',
  'aria-expanded:bg-gray-100 dark:aria-expanded:bg-gray-700',
);
