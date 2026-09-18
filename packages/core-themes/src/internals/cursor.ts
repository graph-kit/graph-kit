import type { Cursor } from '@core/utils/cursor';

/**
 * when used as a canvas.cursor theme value, defers cursor resolution to
 * element-level cursor styles (eg. node.default.cursor).
 *
 * `undefined` is not used for this purpose because theme getter callbacks
 * already use `undefined` to signal "pass control to the next theme entry".
 */
export const CURSOR_FALLBACK = 'fallback' as const;
export type CursorFallback = typeof CURSOR_FALLBACK;

/**
 * the same "no opinion" in the spelling a canvas surface uses, for handing a
 * resolved cursor token to one
 */
export const toSurfaceCursor = (
  resolved: Cursor | CursorFallback,
): Cursor | undefined => (resolved === CURSOR_FALLBACK ? undefined : resolved);
