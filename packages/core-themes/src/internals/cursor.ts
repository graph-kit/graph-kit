/**
 * when used as a canvas.cursor theme value, defers cursor resolution to
 * element-level cursor styles (eg. node.default.cursor).
 *
 * `undefined` is not used for this purpose because theme getter callbacks
 * already use `undefined` to signal "pass control to the next theme entry".
 */
export const CURSOR_FALLBACK = 'fallback' as const;
export type CursorFallback = typeof CURSOR_FALLBACK;
