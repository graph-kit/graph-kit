import colors from '@core/utils/colors';
import { BasicColorMode } from '@vueuse/core';

import { OnboardingPalette } from './types.ts';

const PALETTES: Record<BasicColorMode, OnboardingPalette> = {
  light: {
    cardColor: colors.GRAY_200,
    borderColor: colors.GRAY_200,
    labelColor: colors.GRAY_800,
    thumbnailColor: colors.GRAY_300,
    iconColor: colors.GRAY_800,
  },
  dark: {
    cardColor: colors.GRAY_700,
    borderColor: colors.GRAY_700,
    labelColor: colors.GRAY_50,
    thumbnailColor: colors.GRAY_800,
    iconColor: colors.GRAY_50,
  },
};

export const onboardingPalette = (appearance: BasicColorMode) =>
  PALETTES[appearance];
