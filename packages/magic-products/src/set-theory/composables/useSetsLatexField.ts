import { isMac } from '@core/utils/keyboard';
import type { MathfieldElement } from '@magic/shared/latex';

import { SET_OPS, SYMBOL_KEY_TO_LATEX } from '../constants.ts';

// widened so a letter that carries no operator reads as undefined instead of failing to index
const OPERATOR_BY_LETTER: Record<string, string | undefined> =
  Object.fromEntries(
    Object.entries(SET_OPS).map(([letter, { latex }]) => [letter, latex]),
  );

/**
 * teaches a latex field the alphabet a set query is written in.
 *
 * sets are named with capital letters, so every letter types its capital and the platform's
 * mod key is the only thing that asks for an operator, leaving the case that lands out of
 * the meaning.
 */
export const useSetsLatexField = (mathfield: MathfieldElement) => {
  mathfield.inlineShortcuts = {
    ...mathfield.inlineShortcuts,
    ...SYMBOL_KEY_TO_LATEX,
  };

  mathfield.addEventListener('keydown', (event) => {
    if (event.altKey) return;
    if (!/^[a-zA-Z]$/.test(event.key)) return;

    const letter = event.key.toUpperCase();
    const modPressed = isMac() ? event.metaKey : event.ctrlKey;

    if (modPressed) {
      const operator = OPERATOR_BY_LETTER[letter];
      // every other mod chord is the field's own, copy and select all among them
      if (!operator) return;
      event.preventDefault();
      mathfield.executeCommand(['insert', operator]);
      return;
    }

    // the other platform's mod key names no operator here, so it keeps whatever it means
    if (event.ctrlKey || event.metaKey) return;

    event.preventDefault();
    mathfield.executeCommand(['insert', letter]);
  });
};
