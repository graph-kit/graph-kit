import { CURSOR_FALLBACK } from '@core/themes/index';
import colors from '@core/utils/colors';
import { CURSOR } from '@core/utils/cursor';

import type { SetsThemes } from './tokens.ts';

export type SetsPreset = { [Token in keyof SetsThemes]: SetsThemes[Token] };

/** what does not change between light and dark */
const shared = {
  'set.outline.width': 8,
  'set.cursor': CURSOR.GRAB,
  'set.label.size': 24,
  'set.label.fontWeight': 'bold',
  'section.stripeWidth': 8,
  // the canvas has no opinion, so the element under the pointer decides
  'canvas.cursor': CURSOR_FALLBACK,
  'canvas.patternColor': (alpha: string) => colors.GRAY_500 + alpha,
} as const satisfies Partial<SetsPreset>;

export const light: SetsPreset = {
  ...shared,
  'set.outline.color': colors.GRAY_800,
  'set.outline.focused.color': colors.BLUE_600,
  'set.label.color': colors.GRAY_900,
  'canvas.color': colors.GRAY_300,
};

export const dark: SetsPreset = {
  ...shared,
  'set.outline.color': colors.GRAY_900,
  'set.outline.focused.color': colors.RED_700,
  'set.label.color': colors.WHITE,
  'canvas.color': colors.GRAY_600,
};

export const SETS_PRESETS = { light, dark } as const;

export type SetsPresetName = keyof typeof SETS_PRESETS;
