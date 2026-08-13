import { describe, expect, it } from 'vitest';

import { parseMathJSON } from './parseMathJSON.ts';

describe('parseMathJSON', () => {
  it('reads negation as complement', () => {
    expect(parseMathJSON('\\neg A').json).toEqual(['Complement', 'A']);
    expect(parseMathJSON('\\lnot A').json).toEqual(['Complement', 'A']);
  });

  it('binds negation tighter than the set operators around it', () => {
    expect(parseMathJSON('\\neg A \\cup B').json).toEqual([
      'Union',
      ['Complement', 'A'],
      'B',
    ]);
    expect(parseMathJSON('\\neg A \\cap \\neg B').json).toEqual([
      'Intersection',
      ['Complement', 'A'],
      ['Complement', 'B'],
    ]);
    expect(parseMathJSON('A \\setminus \\neg B').json).toEqual([
      'SetMinus',
      'A',
      ['Complement', 'B'],
    ]);
  });

  it('negates a whole parenthesized expression', () => {
    expect(parseMathJSON('\\neg (A \\triangle B)').json).toEqual([
      'Complement',
      ['SymmetricDifference', 'A', 'B'],
    ]);
  });

  it('reads negation and the complement postfix as the same operator', () => {
    expect(parseMathJSON('\\neg A').json).toEqual(
      parseMathJSON('A^\\complement').json,
    );
  });

  it('leaves the untouched operators parsing as they did', () => {
    expect(parseMathJSON('(A \\cup B) \\cap \\Omega').json).toEqual([
      'Intersection',
      ['Union', 'A', 'B'],
      'Omega',
    ]);
  });
});
