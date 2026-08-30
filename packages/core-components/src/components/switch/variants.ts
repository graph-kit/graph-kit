// the track sizes the control; the thumb slides the width of the track less its
// own width and the padding on both sides
export const switchTrackClasses =
  'inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50';

export const switchThumbClasses =
  'block h-5 w-5 rounded-full shadow-sm transition-transform will-change-transform data-[state=checked]:translate-x-5';
