import { isMac } from '@core/utils/keyboard';

import { ShortcutKey } from './useShortcuts.ts';

/** one segment of a binding, as a symbol where it has to fit inline and as a chip that has room to name it */
type SegmentDisplay = {
  symbol: string;
  label: string;
};

const symbolOnly = (symbol: string): SegmentDisplay => ({
  symbol,
  label: symbol,
});

const named = (symbol: string, name: string): SegmentDisplay => ({
  symbol,
  label: `${symbol} ${name}`,
});

const modifierDisplays = (): Record<string, SegmentDisplay> => ({
  mod: isMac() ? named('⌘', 'Command') : symbolOnly('Ctrl'),
  meta: isMac() ? named('⌘', 'Command') : symbolOnly('Meta'),
  shift: { symbol: isMac() ? '⇧' : 'Shift', label: '⇧ Shift' },
  alt: isMac() ? named('⌥', 'Option') : symbolOnly('Alt'),
  ctrl: isMac() ? named('⌃', 'Ctrl') : symbolOnly('Ctrl'),
});

const KEY_DISPLAYS: Record<string, SegmentDisplay> = {
  left: symbolOnly('←'),
  arrowleft: symbolOnly('←'),
  right: symbolOnly('→'),
  arrowright: symbolOnly('→'),
  up: symbolOnly('↑'),
  arrowup: symbolOnly('↑'),
  down: symbolOnly('↓'),
  arrowdown: symbolOnly('↓'),
  escape: symbolOnly('Esc'),
  esc: symbolOnly('Esc'),
  space: symbolOnly('Space'),
  plus: symbolOnly('+'),
  backspace: named('⌫', 'Backspace'),
  delete: symbolOnly('Del'),
  enter: named('↵', 'Enter'),
  tab: symbolOnly('Tab'),
};

/** splits the binding as ctrl-keys parses it, so the `+` key gets its own segment */
const segments = (key: string) => {
  if (key === '+') return ['+'];
  if (key.endsWith('+')) return [...key.slice(0, -2).split('+'), '+'];
  return key.split('+');
};

const displaySegments = (key: ShortcutKey): SegmentDisplay[] => {
  const modifiers = modifierDisplays();

  return segments(key).map((segment) => {
    const display = modifiers[segment] ?? KEY_DISPLAYS[segment];
    if (display) return display;
    return symbolOnly(segment.length === 1 ? segment.toUpperCase() : segment);
  });
};

/** one chip per segment, e.g. 'mod+shift+z' reads as ⌘ ⇧ Z */
export const formatShortcutKey = (key: ShortcutKey): string[] =>
  displaySegments(key).map(({ label }) => label);

/** the whole binding as one string, e.g. 'mod+i' reads as ⌘I on mac and Ctrl+I everywhere else */
export const shortcutKeyToString = (key: ShortcutKey): string =>
  displaySegments(key)
    .map(({ symbol }) => symbol)
    .join(isMac() ? '' : '+');
