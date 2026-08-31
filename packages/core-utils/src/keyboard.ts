const TYPING_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/**
 * true when the keystroke belongs to a text-entry element, meaning it is the
 * user typing rather than reaching for a shortcut. anything listening on
 * document (shortcuts, canvas keybinds) has to bail on these or it steals
 * keystrokes out from under whatever the user is filling in.
 */
export const isTypingTarget = (event: KeyboardEvent) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return false;
  return TYPING_TAGS.has(target.tagName) || target.isContentEditable;
};

/**
 * true when the keystroke landed inside an open dialog, which owns it rather than
 * whatever it is covering. a shortcut layer that acts here reaches past the dialog to
 * the canvas underneath, and preventing the default on the way steals the escape a
 * dialog closes itself on.
 */
export const isDialogTarget = (event: KeyboardEvent) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return false;
  return !!target.closest('[role="dialog"], [role="alertdialog"]');
};
