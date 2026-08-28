// every property the light half sets needs a dark counterpart, since an unprefixed
// utility keeps applying in dark mode and would otherwise leak across the themes
export const switchTrack =
  'bg-gray-300 data-[state=checked]:bg-blue-500 dark:bg-gray-900 dark:data-[state=checked]:bg-blue-600';

export const switchThumb = 'bg-white dark:bg-gray-200';
