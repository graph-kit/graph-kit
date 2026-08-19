import { ThemeOverrides, ThemeValue } from '@core/themes/index';
import { Color } from '@core/utils/colors';

export type AnnotationsThemes = {
  'annotations.eraser.outline.color': ThemeValue<Color>;
};

export const createAnnotationsThemeOverrides =
  (): ThemeOverrides<AnnotationsThemes> => ({
    'annotations.eraser.outline.color': [],
  });
