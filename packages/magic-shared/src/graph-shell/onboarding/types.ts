import { FontFamily, FontWeight } from '@canvas/primitives/text/types';

/** one thing worth doing on an empty canvas, as the onboarding card lists it */
export type OnboardingItem = {
  imageUrl: string;
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
  /** sits just off the canvas behind it rather than on top of it */
  cardColor: string;
  borderColor: string;
  labelColor: string;
  /** behind a thumbnail, so a transparent image still reads as a tile */
  thumbnailColor: string;
};
