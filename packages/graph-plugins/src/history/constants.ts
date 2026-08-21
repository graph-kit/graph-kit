/**
 * the max number of records to keep. once exceeded the oldest record is dropped, so
 * the graph can no longer be walked all the way back to where it started.
 */
export const MAX_HISTORY = 100;

export const HISTORY_PLUGIN_ID = 'plugins/history';

/**
 * plugins whose state a restore should leave alone. camera pan/zoom is the motivating
 * case: undoing a node addition must not also yank the viewport back to wherever it
 * happened to be at the time. these slices are stripped on capture and refilled from
 * live state on restore, so they never take part in history at all.
 *
 * TODO this belongs on the plugin rather than in a list here. a plugin should declare
 * whether the state it owns is history relevant alongside its transit controls.
 */
export const PLUGINS_EXCLUDED_FROM_HISTORY: string[] = ['surface'];
