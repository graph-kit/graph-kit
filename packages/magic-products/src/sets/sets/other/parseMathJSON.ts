import {
  ComputeEngine,
  LATEX_DICTIONARY,
  type LatexDictionaryEntry,
  LatexSyntax,
} from '@cortex-js/compute-engine';

import { ALPHABET } from './constants.ts';
import { LATEX_SET_SYMBOLS } from './constants.ts';

// both spellings of the negation glyph a query can carry, see SET_OP_TO_LATEX
const NEGATION_TRIGGERS: string[] = ['\\neg', '\\lnot'];

const isNegation = (entry: Partial<LatexDictionaryEntry>) => {
  if (!('kind' in entry) || entry.kind !== 'prefix') return false;
  if (!('latexTrigger' in entry)) return false;
  const trigger = entry.latexTrigger ?? [];
  const tokens = Array.isArray(trigger) ? trigger : [trigger];
  return tokens.length === 1 && NEGATION_TRIGGERS.includes(tokens[0]);
};

// a query only ever names sets, so negating one means taking its complement, and left as the
// boolean `Not` it ships as the engine types it as a boolean that no set operator accepts
const dictionary = LATEX_DICTIONARY.map((entry) =>
  isNegation(entry)
    ? // the name drops with it, since the entry no longer stands for `Not`
      { ...entry, name: undefined, parse: LATEX_SET_SYMBOLS.COMPLEMENT }
    : entry,
);

const engine = new ComputeEngine({
  latexSyntax: new LatexSyntax({ dictionary }),
});

// make sure that all upper case chars and Omega are treated as sets in the compute engine
// otherwise it might not interpret correctly and throw error even for correct syntax
for (const letter of ALPHABET) {
  engine.declare(letter, 'set');
}
engine.declare(LATEX_SET_SYMBOLS.OMEGA, 'set');

export const parseMathJSON = (latex: string) => engine.parse(latex);
