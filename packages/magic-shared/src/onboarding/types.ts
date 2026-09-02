import { FontFamily, FontWeight } from '@canvas/primitives/text/types';

/** one thing worth doing on an empty canvas */
export type OnboardingItem = {
  /** an mdi icon path, as exported by `@mdi/js` */
  icon: string;
  display: string;
};

/** everything measuring and painting a string both need to agree on */
export type OnboardingFont = {
  fontSize: number;
  fontWeight: FontWeight;
  fontFamily: FontFamily;
};

/** the colors the card is painted in, resolved from the shell's appearance */
export type OnboardingPalette = {
  /** a shade off the canvas behind it rather than a contrast against it */
  cardColor: string;
  borderColor: string;
  labelColor: string;
  /** behind an icon, so a transparent image still reads as a tile */
  thumbnailColor: string;
  /** what an icon has to be painted in to read on {@link OnboardingPalette.thumbnailColor} */
  iconColor: string;
};
