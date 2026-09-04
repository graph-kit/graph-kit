/** Controls the active theme for a plugin, exposing override layer management and token resolution. */
export {
  type ThemeController,
  createThemeController,
} from './internals/createThemeController.ts';

/** Resolves a single theme token against the active override layers and preset. */
export {
  type TokenResolver,
  createTokenResolver,
} from './internals/createTokenResolver.ts';

/** A layered override slot for a single theme token, scoped to a plugin instance. */
export { type ThemeLayer, createLayer } from './internals/createLayer.ts';

/** A theme token value — either a direct value or a getter that can defer to the next layer. */
export type {
  ThemeValue,
  ThemeOverrides,
  ThemeOverride,
} from './internals/types.ts';

/** All cursor values supported by the browser. */
export { CURSOR_FALLBACK, canvasCursorOverride } from './internals/cursor.ts';
export type { CursorFallback } from './internals/cursor.ts';
