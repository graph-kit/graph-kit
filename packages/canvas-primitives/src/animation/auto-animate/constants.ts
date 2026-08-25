import { EverySchemaPropName } from '../../types/index.ts';

export const DEFAULT_AUTO_ANIMATE_DURATION_MS = 500;

/** marks a schema as a ghost's redraw rather than a shape the consumer drew */
export const GHOST_REDRAW = Symbol('ghost redraw');

/**
 * properties supported by the auto animate feature.
 *
 * ⚠️ **only properties listed here will be animated with `createAutoAnimate`**
 */
export const AUTO_ANIMATED_PROPERTIES = new Set<EverySchemaPropName>([
  'at',
  'start',
  'end',
  'lineWidth',
  'radius',
  'fillColor',
]);
