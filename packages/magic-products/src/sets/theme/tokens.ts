import type { FontWeight } from '@canvas/primitives/text/types';
import type {
  CursorFallback,
  ThemeOverrides,
  ThemeValue,
} from '@core/themes/index';
import type { Color } from '@core/utils/colors';
import type { Cursor } from '@core/utils/cursor';

/**
 * everything the sets canvas paints itself from. sets owns these rather than
 * borrowing the graph's node tokens, which is what it used to do
 */
export type SetsThemes = {
  'set.outline.color': ThemeValue<Color>;
  'set.outline.focused.color': ThemeValue<Color>;
  'set.outline.width': ThemeValue<number>;
  'set.cursor': ThemeValue<Cursor>;
  'set.label.color': ThemeValue<Color>;
  'set.label.size': ThemeValue<number>;
  'set.label.fontWeight': ThemeValue<FontWeight>;

  'section.stripeWidth': ThemeValue<number>;

  'annotations.eraser.outline.color': ThemeValue<Color>;

  'canvas.color': ThemeValue<Color>;
  /** takes the alpha and nothing else, resolved once a frame for every cell */
  'canvas.patternColor': ThemeValue<string, [alpha: string]>;
  'canvas.cursor': ThemeValue<Cursor | CursorFallback>;
};

export type SetsThemeToken = keyof SetsThemes;

export const createSetsThemeOverrides = (): ThemeOverrides<SetsThemes> => ({
  'set.outline.color': [],
  'set.outline.focused.color': [],
  'set.outline.width': [],
  'set.cursor': [],
  'set.label.color': [],
  'set.label.size': [],
  'set.label.fontWeight': [],

  'section.stripeWidth': [],

  'annotations.eraser.outline.color': [],

  'canvas.color': [],
  'canvas.patternColor': [],
  'canvas.cursor': [],
});
