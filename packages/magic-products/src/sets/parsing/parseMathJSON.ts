import {
  ComputeEngine,
  LATEX_DICTIONARY,
  type LatexDictionaryEntry,
  LatexSyntax,
} from '@cortex-js/compute-engine';

import { ALPHABET } from '../constants.ts';
import { LATEX_SET_SYMBOLS } from '../constants.ts';

// the two prefix spellings of the negation glyph, either of which a query can carry
const NEGATION_PREFIXES: string[] = ['\\neg', '\\lnot'];

/** true for every entry writing a negation, in the prefix notation or the postfix one */
const isNegation = (entry: Partial<LatexDictionaryEntry>) => {
  if (!('kind' in entry) || !('latexTrigger' in entry)) return false;

  const trigger = entry.latexTrigger ?? [];
  const tokens = Array.isArray(trigger) ? trigger : [trigger];

  // the complement postfix, braced or not, is the same operator written the other way
  if (entry.kind === 'postfix') return tokens.includes('\\complement');

  return entry.kind === 'prefix' && NEGATION_PREFIXES.includes(tokens[0]);
};

// negation is the product's own head rather than the engine's `Not`, a boolean operator
// that no set operator accepts as an argument and that carries boolean rewrite rules
const dictionary = LATEX_DICTIONARY.map((entry) =>
  isNegation(entry)
    ? // the name and serializer go too, since the entry no longer stands for the head it named
      {
        ...entry,
        name: undefined,
        serialize: undefined,
        parse: LATEX_SET_SYMBOLS.NEGATION,
      }
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
engine.declare(LATEX_SET_SYMBOLS.NEGATION, '(set) -> set');

export const parseMathJSON = (latex: string) => engine.parse(latex);
