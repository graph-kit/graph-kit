import {
  CursorFallback,
  ThemeOverrides,
  ThemeValue,
} from '@core/themes/index';
import { Color } from '@core/utils/colors';
import { Cursor } from '@core/utils/cursor';

export type MarqueeThemes = {
  'marquee.drag.color': ThemeValue<Color>;
  'marquee.drag.border.color': ThemeValue<Color>;
  'marquee.drag.border.width': ThemeValue<number>;
  'marquee.selection.color': ThemeValue<Color>;
  'marquee.selection.border.color': ThemeValue<Color>;
  'marquee.selection.border.width': ThemeValue<number>;
  'marquee.selection.cursor': ThemeValue<Cursor | CursorFallback>;
};

export const createMarqueeThemeOverrides =
  (): ThemeOverrides<MarqueeThemes> => ({
    'marquee.drag.color': [],
    'marquee.drag.border.color': [],
    'marquee.drag.border.width': [],
    'marquee.selection.color': [],
    'marquee.selection.border.color': [],
    'marquee.selection.border.width': [],
    'marquee.selection.cursor': [],
  });
