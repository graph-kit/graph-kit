import type { MathfieldElement } from '@magic/shared/latex';

import { LATEX_HOTKEYS } from '../other/constants.ts';

/**
 * teaches a latex field the alphabet a set query is written in.
 *
 * sets are named with capital letters, so a lowercase keystroke is always a typo rather
 * than a different variable.
 */
export const useSetsLatexField = (mathfield: MathfieldElement) => {
  mathfield.inlineShortcuts = {
    ...mathfield.inlineShortcuts,
    ...LATEX_HOTKEYS,
  };

  // a hotkey letter is left alone so its shortcut still expands into an operator
  mathfield.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key.length !== 1) return;
    if (!/^[a-zA-Z]$/.test(event.key)) return;
    if (event.key in LATEX_HOTKEYS) return;

    event.preventDefault();
    mathfield.executeCommand(['insert', event.key.toUpperCase()]);
  });
};
