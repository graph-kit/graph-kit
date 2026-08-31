import { Key } from 'ctrl-keys';

// called rather than read once, since prerender has no navigator to ask
const isMac = () =>
  typeof navigator !== 'undefined' && /mac/i.test(navigator.userAgent);

/**
 * the bindings fire on the meta key itself, so off mac this reads Meta rather than
 * Ctrl: naming the key windows users would actually have to press is what the TODO
 * on the shell's own bindings is about
 */
const modifierSymbols = () => ({
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
  backspace: '⌫',
  delete: 'Del',
  enter: '↵',
  tab: 'Tab',
};

/**
 * splits the binding the way ctrl-keys parses it, so the `+` key carries its own
 * segment rather than leaving an empty one behind
 */
const segments = (key: string) => {
  if (key === '+') return ['+'];
  if (key.endsWith('+')) return [...key.slice(0, -2).split('+'), '+'];
  return key.split('+');
};

/** one chip per segment, e.g. 'meta+shift+z' reads as ⌘ ⇧ Z */
export const formatShortcutKey = (key: Key): string[] => {
  const modifiers: Record<string, string> = modifierSymbols();

  return segments(key).map((segment) => {
    const modifier = modifiers[segment];
    if (modifier) return modifier;
    const symbol = KEY_SYMBOLS[segment];
    if (symbol) return symbol;
    return segment.length === 1 ? segment.toUpperCase() : segment;
  });
};
