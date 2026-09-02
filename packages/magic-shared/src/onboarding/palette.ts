import colors from '@core/utils/colors';
import { BasicColorMode } from '@vueuse/core';

import { OnboardingPalette } from './types.ts';

/** the same in both appearances, since an item's image is a url that cannot recolor */
export const TILE_COLOR = colors.GRAY_800;

/** what an icon drawn onto {@link TILE_COLOR} has to be painted in to read */
export const ICON_COLOR = colors.GRAY_50;

const PALETTES: Record<BasicColorMode, OnboardingPalette> = {
  light: {
    cardColor: colors.GRAY_200,
    borderColor: colors.GRAY_200,
    labelColor: colors.GRAY_800,
    thumbnailColor: TILE_COLOR,
  },
  dark: {
    cardColor: colors.GRAY_700,
    borderColor: colors.GRAY_700,
    labelColor: colors.GRAY_50,
    thumbnailColor: TILE_COLOR,
  },
};

export const onboardingPalette = (appearance: BasicColorMode) =>
  PALETTES[appearance];
