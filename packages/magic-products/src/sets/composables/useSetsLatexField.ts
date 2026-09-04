import type { MathfieldElement } from '@magic/shared/latex';

import { SET_OP_TO_LATEX, SYMBOL_KEY_TO_LATEX } from '../constants.ts';

// widened so a letter that carries no operator reads as undefined instead of failing to index
const OPERATOR_BY_LETTER: Record<string, string | undefined> = SET_OP_TO_LATEX;

/**
 * teaches a latex field the alphabet a set query is written in.
 *
 * sets are named with capital letters, so every letter types its capital and shift is the
 * only thing that asks for an operator, leaving the case that lands out of the meaning.
 */
export const useSetsLatexField = (mathfield: MathfieldElement) => {
  mathfield.inlineShortcuts = {
    ...mathfield.inlineShortcuts,
    ...SYMBOL_KEY_TO_LATEX,
  };

  mathfield.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (!/^[a-zA-Z]$/.test(event.key)) return;

    const letter = event.key.toUpperCase();
    const operator = event.shiftKey ? OPERATOR_BY_LETTER[letter] : undefined;

    event.preventDefault();
    mathfield.executeCommand(['insert', operator ?? letter]);
  });
};
