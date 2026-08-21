import colors from '@core/utils/colors';

export const DEFAULT_BRUSH_WEIGHT = 3;
export const DEFAULT_COLOR = colors.RED_600;

export const ANNOTATION_MODES = ['drawing', 'erasing', 'laser'] as const;

export const ERASER_BRUSH_RADIUS = 10;

/** alpha suffix marking an annotation the eraser is over but has not committed yet */
export const ERASING_ALPHA = '50';

/**
 * how much of the pointer's recent motion the trail holds. an age rather than a size, so
 * a fast drag draws a long tail and a slow one a short tail
 */
export const LASER_TRAIL_MS = 220;

/** a ceiling on the tail, so a single violent flick cannot paint the whole canvas */
export const LASER_TRAIL_MAX_LENGTH = 500;

/** the size every segment of the trail is resampled to, so a fast drag is not choppy */
export const LASER_SEGMENT_LENGTH = 4;

/** how long the trail takes to whip away once the cursor stops moving */
export const LASER_FADE_MS = 280;

/** how often the trail is trimmed; a frame, so the tail slides rather than steps */
export const LASER_DECAY_MS = 16;

/** how many runs the trail is drawn in to taper it, and how thin its tail run gets */
export const LASER_TAPER_RUNS = 6;
export const LASER_TAPER_MIN_SCALE = 0.2;

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
export const LASER_TRAIL_ID = 'annotation-laser-trail';
export const IN_PROGRESS_ANNOTATION_ID = 'annotation-in-progress';
