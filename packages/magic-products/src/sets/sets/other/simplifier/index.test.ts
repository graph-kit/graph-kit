import { describe, expect, it } from 'vitest';

import { OUTSIDE_ALL_SETS } from '../constants.ts';
import { simplify } from './index.ts';

// a two set canvas, labelled the way the set space hands its definitions over
const CANVAS = {
  A: 'set-a',
  B: 'set-b',
  [OUTSIDE_ALL_SETS.label]: OUTSIDE_ALL_SETS.identity,
};

describe(simplify, () => {
  it('writes a query covering every section as the universal set', () => {
    expect(simplify('\\Omega \\cup \\Omega', CANVAS)).toBe('\\Omega');
    expect(simplify('\\Omega \\cup A', CANVAS)).toBe('\\Omega');
    expect(simplify('A \\cup \\neg A', CANVAS)).toBe('\\Omega');
    expect(simplify('A \\cup B \\cup S', CANVAS)).toBe('\\Omega');
  });

  it('offers nothing for a query already written as the universal set', () => {
    expect(simplify('\\Omega', CANVAS)).toBeNull();
  });

  it('writes a query selecting no section as the empty query it is', () => {
    expect(simplify('A \\cap \\neg A', CANVAS)).toBe('');
    expect(simplify('\\neg \\Omega', CANVAS)).toBe('');
    expect(simplify('A \\setminus A', CANVAS)).toBe('');
    expect(simplify('A \\triangle A', CANVAS)).toBe('');
  });

  it('offers nothing for a query already written as the empty query', () => {
    expect(simplify('', CANVAS)).toBeNull();
    expect(simplify('   ', CANVAS)).toBeNull();
  });

  it('reads the universal set and the outside section as real selections', () => {
    expect(simplify('\\Omega \\cap A', CANVAS)).toBe('A');
    expect(simplify('\\neg (A \\cup B) \\cup S', CANVAS)).toBe(
      '\\neg \\left(A \\cup B\\right)',
    );
  });
});
