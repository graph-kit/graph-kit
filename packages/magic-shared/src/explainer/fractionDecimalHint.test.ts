import Fraction from 'fraction.js';
import { describe, expect, test } from 'vitest';

import { fractionDecimalHint } from './fractionDecimalHint.ts';

describe('fractionDecimalHint', () => {
  test('returns undefined for fractions that reduce to an integer', () => {
    expect(fractionDecimalHint(new Fraction(3))).toBeUndefined();
    expect(fractionDecimalHint(new Fraction(4, 2))).toBeUndefined();
    expect(fractionDecimalHint(new Fraction(0))).toBeUndefined();
  });

  test('returns the decimal for fractions with a fractional part', () => {
    expect(fractionDecimalHint(new Fraction(5, 2))).toBe('2.5');
    expect(fractionDecimalHint(new Fraction(1, 3))).toBe('~0.333');
  });

  test('respects the requested precision', () => {
    expect(fractionDecimalHint(new Fraction(1, 3), 1)).toBe('~0.3');
  });
});
