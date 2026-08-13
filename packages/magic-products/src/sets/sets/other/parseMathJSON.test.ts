import { describe, expect, it } from 'vitest';

import { parseMathJSON } from './parseMathJSON.ts';


describe(parseMathJSON, () => {
  it('reads negation as its own head', () => {
    expect(parseMathJSON('\\neg A').json).toEqual(['Negation', 'A']);
    expect(parseMathJSON('\\lnot A').json).toEqual(['Negation', 'A']);
  });

  it('collapses the complement postfix into negation', () => {
    expect(parseMathJSON('A^\\complement').json).toEqual(['Negation', 'A']);
    expect(parseMathJSON('A^{\\complement}').json).toEqual(['Negation', 'A']);
    expect(parseMathJSON('(A^\\complement)^\\complement').json).toEqual([
      'Negation',
      ['Negation', 'A'],
    ]);

  it('binds negation tighter than the set operators around it', () => {
    expect(parseMathJSON('\\neg A \\cup B').json).toEqual([
      'Union',
      ['Negation', 'A'],
      'B',
    ]);
    expect(parseMathJSON('\\neg A \\cap \\neg B').json).toEqual([
      'Intersection',
      ['Negation', 'A'],
      ['Negation', 'B'],
    ]);
    expect(parseMathJSON('A \\setminus \\neg B').json).toEqual([
      'SetMinus',
      'A',
      ['Negation', 'B'],
    ]);
  });

  it('negates a whole parenthesized expression', () => {
    expect(parseMathJSON('\\neg (A \\triangle B)').json).toEqual([
      'Negation',
      ['SymmetricDifference', 'A', 'B'],
    ]);
  });

  it('leaves the untouched operators parsing as they did', () => {
    expect(parseMathJSON('(A \\cup B) \\cap \\Omega').json).toEqual([
      'Intersection',
      ['Union', 'A', 'B'],
      'Omega',
    ]);
  });
});
