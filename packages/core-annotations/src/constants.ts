import colors from '@core/utils/colors';

export const DEFAULT_BRUSH_WEIGHT = 6;
export const DEFAULT_COLOR = colors.RED_600;

export const ANNOTATION_MODES = ['drawing', 'erasing', 'laser'] as const;

export const ERASER_BRUSH_RADIUS = 10;

/** alpha suffix marking an annotation the eraser is over but has not committed yet */
export const ERASING_ALPHA = '50';

/** how many points of the laser trail stay on screen behind the cursor */
export const LASER_TRAIL_LENGTH = 10;

/** how long the trail holds a point once the cursor stops moving */
export const LASER_DECAY_MS = 50;

export const ERASER_OUTLINE_WIDTH = 2;

/**
 * annotations sit above everything a host draws, and the cursor the tools paint sits
 * above the annotations themselves
 */
export const ANNOTATION_PRIORITY = 5000;
export const ANNOTATION_IN_PROGRESS_PRIORITY = 5001;
export const ANNOTATION_CURSOR_PRIORITY = 5050;

export const ERASER_CURSOR_ID = 'annotation-eraser-cursor';
export const LASER_CURSOR_ID = 'annotation-laser-cursor';
export const IN_PROGRESS_ANNOTATION_ID = 'annotation-in-progress';
