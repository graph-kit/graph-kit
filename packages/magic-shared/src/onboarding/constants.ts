import { OnboardingFont } from './types.ts';

export const ONBOARDING_ELEMENT_ID_PREFIX = 'graph-shell/onboarding';

export const ONBOARDING_PRIORITY = -1000;

export const CARD_PADDING = 16;
export const CARD_BORDER_RADIUS = 8;
export const CARD_BORDER_WIDTH = 2;

export const THUMBNAIL_SIZE = 48;
export const THUMBNAIL_BORDER_RADIUS = 8;
/** between a thumbnail and the name beside it */
export const THUMBNAIL_GAP = 18;
/** inset between the tile and the image it frames */
export const THUMBNAIL_PADDING = 10;

export const ROW_HEIGHT = THUMBNAIL_SIZE;
export const ROW_GAP = 14;

export const LABEL_FONT: OnboardingFont = {
  fontSize: 18,
  fontWeight: 'bold',
  fontFamily: 'Arial',
};
