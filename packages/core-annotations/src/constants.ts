import colors from '@core/utils/colors';

export const DEFAULT_BRUSH_WEIGHT = 6;
export const DEFAULT_COLOR = colors.RED_600;

export const ANNOTATION_MODES = ['drawing', 'erasing', 'laser'] as const;

export const ERASER_BRUSH_RADIUS = 10;

/** alpha suffix marking an annotation the eraser is over but has not committed yet */
export const ERASING_ALPHA = '50';

/**
 * how far behind the cursor the laser trail reaches, in world units. a distance rather
 * than a point count, since points arrive one per drawn frame and a count would make the
 * trail as long as the cursor was fast
 */
export const LASER_TRAIL_LENGTH = 140;

/** how long the trail stays whole before it starts bleeding off */
export const LASER_HOLD_MS = 150;

/** how long the trail takes to bleed off once past {@link LASER_HOLD_MS} */
export const LASER_DECAY_MS = 400;

/** an upper bound on the buffer, not on the trail, which is cut to a distance */
export const LASER_MAX_POINTS = 64;

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
