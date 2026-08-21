import type { LooseGraphPlugin } from './internals/loose.ts';

// --- for plugin authors ---

/** The type for a graph plugin. Use this to type your plugin function. */
export type { GraphPlugin } from './internals/plugin.ts';

/** Wraps a plugin's controls with lifecycle methods (enable/disable). */
export type { WithLifecycle } from '../lifecycle/createLifecycle.ts';

export type { WithEvents } from './internals/events.ts';

/** Wraps a plugin's controls with a theme controller. */
export type { WithTheme, PluginThemeField } from './internals/themes.ts';

/** Extracts the options type from a plugin function's first parameter. */
export type PluginOptions<Plugin extends LooseGraphPlugin> =
  Parameters<Plugin>[0];

// --- for the graph orchestrator ---

/**
 * The loose, unresolved plugin type used for plugin list inference.
 * Plugin authors should use {@link GraphPlugin} instead.
 */
export type { LooseGraphPlugin };

/** Extracts the merged theme map from a list of plugins. To build the theming interface. */
export type { PluginThemes } from './internals/themes.ts';

/** Extracts the merged controls type from a list of plugins. To assemble the graph controls. */
export type { ExtractControls } from './internals/extractors.ts';

/** Extracts the merged getters type from a list of plugins. To build the getters interface. */
export type { ExtractGetters } from './internals/extractors.ts';

/** Extracts the merged actions type from a list of plugins. To build the actions interface. */
export type { ExtractActions } from './internals/extractors.ts';

/** Extracts the merged transit controls type from a list of plugins. To build the encode/decode interface. */
export type { ExtractTransitPayload } from './internals/extractors.ts';
