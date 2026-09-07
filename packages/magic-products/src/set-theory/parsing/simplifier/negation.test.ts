import { describe, expect, it } from 'vitest';

import { getDisambiguatedLatex } from '../disambiguate.ts';
import { parseMathJSON } from '../parseMathJSON.ts';
import { simplify } from './index.ts';
import { getTruthTable } from './truthTable.ts';

// the atoms of a two set space, in the order getTruthTable bit shifts them
const TWO_SETS = ['A', 'B'];
const OUTSIDE = 'outside';

const truthTable = (latex: string) =>
  getTruthTable(parseMathJSON(latex).json, TWO_SETS, OUTSIDE)
    .toString(2)
    .padStart(2 ** TWO_SETS.length, '0');

describe('negation', () => {
  it('selects every section the negated expression leaves out', () => {
    // bit 0 is the section outside both sets, then {A}, {B}, {A, B}
    expect(truthTable('\\neg A')).toBe('0101');
    expect(truthTable('\\neg (A \\cup B)')).toBe('0001');
    expect(truthTable('A \\cap \\neg B')).toBe('0010');
  });

  it('reads the complement postfix as the same selection', () => {
    expect(truthTable('A^\\complement')).toBe(truthTable('\\neg A'));
  });

  it('simplifies through negation', () => {
    expect(simplify('\\neg \\neg A')).toBe('A');
    expect(simplify('\\neg A \\cap \\neg B')).toBe(
      '\\neg \\left(A \\cup B\\right)',
    );
    expect(simplify('(A \\cap \\neg B) \\cup (\\neg A \\cap B)')).toBe(
      'A \\triangle B',
    );
    expect(simplify('(A \\cap B) \\cup (\\neg A \\cap \\neg B)')).toBe(
      '\\neg \\left(A \\triangle B\\right)',
    );
  });

  it('writes a simplification of complement notation back as negation', () => {
    expect(simplify('A^{\\complement} \\cap B^{\\complement}')).toBe(
      '\\neg \\left(A \\cup B\\right)',
    );
  });

  it('disambiguates around negation without parenthesizing it', () => {
    expect(getDisambiguatedLatex('\\neg A \\cup B \\cap C')).toBe(
      '\\neg A \\cup \\left(B \\cap C\\right)',
    );
  });
});
