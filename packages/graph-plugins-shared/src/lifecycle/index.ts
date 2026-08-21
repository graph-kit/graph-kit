/** Builds the lifecycle controls a plugin exposes. Every plugin that can be toggled uses this. */
export { createLifecycle } from './createLifecycle.ts';

/** Wraps a plugin's controls with lifecycle methods (enable/disable). */
export type { WithLifecycle } from './createLifecycle.ts';

/** The controls returned by {@link createLifecycle}. */
export type { PluginLifecycle } from './createLifecycle.ts';

/** The function that lifts a single suppression taken out on a plugin. */
export type { ReleaseSuppression } from './createLifecycle.ts';

/** The events a plugin's lifecycle triggers as it transitions. */
export type { LifecycleEventMap } from './events.ts';
