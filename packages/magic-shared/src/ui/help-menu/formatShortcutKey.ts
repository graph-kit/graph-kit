import { isMac } from '@core/utils/keyboard';

import { ShortcutKey } from '../../shortcuts/useShortcuts.ts';

const modifierSymbols = () => ({
  mod: isMac() ? '⌘ Command' : 'Ctrl',
  meta: isMac() ? '⌘ Command' : 'Meta',
  shift: '⇧ Shift',
  alt: isMac() ? '⌥' : 'Alt',
  ctrl: isMac() ? '⌃' : 'Ctrl',
});

const KEY_SYMBOLS: Record<string, string> = {
  left: '←',
  arrowleft: '←',
  right: '→',
  arrowright: '→',
  up: '↑',
  arrowup: '↑',
  down: '↓',
  arrowdown: '↓',
  escape: 'Esc',
  esc: 'Esc',
  space: 'Space',
  plus: '+',
  backspace: '⌫ Backspace',
  delete: 'Del',
  enter: '↵ Enter',
  tab: 'Tab',
};

/** splits the binding as ctrl-keys parses it, so the `+` key gets its own segment */
const segments = (key: string) => {
  if (key === '+') return ['+'];
  if (key.endsWith('+')) return [...key.slice(0, -2).split('+'), '+'];
  return key.split('+');
};

/** one chip per segment, e.g. 'mod+shift+z' reads as ⌘ ⇧ Z */
export const formatShortcutKey = (key: ShortcutKey): string[] => {
  const modifiers: Record<string, string> = modifierSymbols();

  return segments(key).map((segment) => {
    const modifier = modifiers[segment];
    if (modifier) return modifier;
    const symbol = KEY_SYMBOLS[segment];
    if (symbol) return symbol;
    return segment.length === 1 ? segment.toUpperCase() : segment;
  });
};
