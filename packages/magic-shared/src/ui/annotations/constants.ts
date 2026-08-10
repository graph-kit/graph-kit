import colors, { Color } from '@core/utils/colors';
import { ANCHOR_PLUGIN_ID } from '@graph/plugins/anchors/constants';
import { FOCUS_PLUGIN_ID } from '@graph/plugins/focus/constants';
import { INTERACTIVE_PLUGIN_ID } from '@graph/plugins/interactive/constants';
import { MARQUEE_PLUGIN_ID } from '@graph/plugins/marquee/constants';
import { NODE_DRAG_PLUGIN_ID } from '@graph/plugins/node-drag/constants';
import { BasicColorMode } from '@vueuse/core';

export const COLORS = [
  colors.RED_600,
  colors.BLUE_600,
  colors.GREEN_600,
  colors.YELLOW_600,
];

export const BRUSH_WEIGHTS = [3, 6, 9, 12];

export const ANNOTATION_MODES = ['drawing', 'erasing', 'laser'] as const;

export const THEME_TO_ERASER_OUTLINE: Record<BasicColorMode, Color> = {
  light: colors.GRAY_900,
  dark: colors.GRAY_100,
};

export const ERASER_BRUSH_RADIUS = 10;

export const ANNOTATION_PLUGIN_ID = 'plugins/annotations';

export const PRIORITY = {
  before: [
    MARQUEE_PLUGIN_ID,
    NODE_DRAG_PLUGIN_ID,
    ANCHOR_PLUGIN_ID,
    FOCUS_PLUGIN_ID,
    INTERACTIVE_PLUGIN_ID,
  ],
} as const;
