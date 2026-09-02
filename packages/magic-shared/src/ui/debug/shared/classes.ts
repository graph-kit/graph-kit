/*
  every debug panel reads at the same size, weight and color so the whole of debug mode
  looks like one tool. gray literals are duplicated across the light and dark halves
  rather than resolved from tokens, which is where the rest of the shell sits today
*/
/** how every debug readout is set, wherever it is rendered */
export const PANEL_TYPE = 'font-mono text-[11px] leading-tight';
export const PANEL = `w-60 ${PANEL_TYPE}`;
export const TITLE = 'text-xs font-bold tracking-wide';
export const SECTION =
  'text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400';

/** what a readout is called, and anything else the eye should skip on its way to a value */
export const LABEL = 'text-gray-500 dark:text-gray-400';
/** the reading itself, tabular so digits do not jitter as they change */
export const VALUE = 'tabular-nums text-gray-900 dark:text-gray-100';

/** how a reading is doing, for the panels that grade one rather than just print it */
export const STATUS_CLASSES = {
  good: 'text-green-600 dark:text-green-400',
  warn: 'text-amber-600 dark:text-amber-400',
  bad: 'text-red-600 dark:text-red-400',
} as const;

export type DebugStatusLevel = keyof typeof STATUS_CLASSES;
