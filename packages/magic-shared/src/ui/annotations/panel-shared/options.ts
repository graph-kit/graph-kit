import { DEFAULT_BRUSH_WEIGHT } from '@core/annotations/constants';
import { AnnotationMode } from '@core/annotations/index';
import colors, { type Color } from '@core/utils/colors';
import { mdiEraser, mdiLaserPointer, mdiPencil } from '@mdi/js';

export const MODE_TO_TOOL: Record<
  AnnotationMode,
  { icon: string; name: string }
> = {
  drawing: { icon: mdiPencil, name: 'Draw' },
  erasing: { icon: mdiEraser, name: 'Erase' },
  laser: { icon: mdiLaserPointer, name: 'Laser' },
};

export type ColorSwatch = {
  name: string;
  value: Color;
};

export const SWATCH_COLORS: ColorSwatch[] = [
  { name: 'Red', value: colors.RED_600 },
  { name: 'Blue', value: colors.BLUE_600 },
  { name: 'Green', value: colors.GREEN_600 },
  { name: 'Yellow', value: colors.YELLOW_600 },
];

export type BrushWeight = {
  name: string;
  value: number;
};

export const BRUSH_WEIGHTS: BrushWeight[] = [
  { name: 'Small', value: DEFAULT_BRUSH_WEIGHT },
  { name: 'Medium', value: DEFAULT_BRUSH_WEIGHT + 3 },
  { name: 'Large', value: DEFAULT_BRUSH_WEIGHT + 6 },
  { name: 'Extra Large', value: DEFAULT_BRUSH_WEIGHT + 9 },
];
