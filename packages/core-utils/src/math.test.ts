import Fraction from 'fraction.js';
import { describe, expect, test } from 'vitest';

import {
  average,
  displayNumber,
  fractionIsInteger,
  fractionToDecimal,
  gcd,
  getPrimeFactors,
  lowestPrimeFactor,
  roundToNearestN,
} from './math.ts';

describe('roundToNearestN', () => {
  test('rounds a number to the nearest multiple of n', () => {
    const roundToNearest5 = roundToNearestN(5);
    expect(roundToNearest5(13)).toBe(15);
    expect(roundToNearest5(12)).toBe(10);
  });
});

describe('getPrimeFactors', () => {
  test('returns the prime factors of a number', () => {
    expect(getPrimeFactors(12)).toEqual([2, 2, 3]);
    expect(getPrimeFactors(15)).toEqual([3, 5]);
  });

  test('edge case: 1', () => {
    expect(getPrimeFactors(1)).toEqual([]);
  });
});

describe('lowestPrimeFactor', () => {
  test('returns the lowest prime factor of a number', () => {
    expect(lowestPrimeFactor(12)).toBe(2);
    expect(lowestPrimeFactor(15)).toBe(3);
  });

  test('edge case: 1', () => {
    expect(lowestPrimeFactor(1)).toBe(1);
  });
});

describe('gcd', () => {
  test('returns the greatest common divisor of two numbers', () => {
    expect(gcd(12, 15)).toBe(3);
    expect(gcd(12, 18)).toBe(6);
  });
});

describe('fractionToDecimal', () => {
  test('leaves exact fractions untouched', () => {
    expect(fractionToDecimal(new Fraction(3))).toBe('3');
    expect(fractionToDecimal(new Fraction(5, 2))).toBe('2.5');
  });

  test('tilde prefixes fractions that lost precision', () => {
    expect(fractionToDecimal(new Fraction(1, 3))).toBe('~0.333');
    expect(fractionToDecimal(new Fraction(1, 3), 1)).toBe('~0.3');
  });

  test('drops trailing zeros', () => {
    expect(fractionToDecimal(new Fraction(1, 2), 3)).toBe('0.5');
  });
});

describe('fractionIsInteger', () => {
  test('returns true for fractions that reduce to an integer', () => {
    expect(fractionIsInteger(new Fraction(3))).toBe(true);
    expect(fractionIsInteger(new Fraction(4, 2))).toBe(true);
    expect(fractionIsInteger(new Fraction(-6, 3))).toBe(true);
  });

  test('returns false for fractions with a fractional part', () => {
    expect(fractionIsInteger(new Fraction(5, 2))).toBe(false);
    expect(fractionIsInteger(new Fraction(1, 3))).toBe(false);
  });

  test('edge case: 0', () => {
    expect(fractionIsInteger(new Fraction(0))).toBe(true);
  });
});

describe('displayNumber', () => {
  test('pairs a fraction with its decimal', () => {
    expect(displayNumber('5/2')).toEqual({
      primary: '5/2',
      secondary: '2.5',
    });
  });

  test('marks a decimal that lost precision as approximate', () => {
    expect(displayNumber('1/3')).toEqual({
      primary: '1/3',
      secondary: '~0.333',
    });
  });

  test('honours the requested decimal places', () => {
    expect(displayNumber('1/3', 1)).toEqual({
      primary: '1/3',
      secondary: '~0.3',
    });
  });

  test('leaves an integer without a decimal to approximate', () => {
    expect(displayNumber('4/2')).toEqual({
      primary: '2',
      secondary: undefined,
    });
  });

  test('turns a decimal into the fraction it came from', () => {
    expect(displayNumber(3.5)).toEqual({
      primary: '7/2',
      secondary: '3.5',
    });
  });

  test('accepts an already built fraction', () => {
    expect(displayNumber(new Fraction(1, 3))).toEqual({
      primary: '1/3',
      secondary: '~0.333',
    });
  });

  test('reads numbers written in exponent notation', () => {
    expect(displayNumber(1e-7)).toEqual({
      primary: '1/10000000',
      secondary: '~0',
    });
  });

  test('ignores surrounding whitespace', () => {
    expect(displayNumber('  3.5  ')).toEqual({
      primary: '7/2',
      secondary: '3.5',
    });
  });

  test('shows infinity as a symbol that needs no decimal', () => {
    for (const infinity of ['∞', String(Infinity), Infinity] as const) {
      expect(displayNumber(infinity)).toEqual({
        primary: '∞',
        secondary: undefined,
      });
    }
  });

  test('shows negative infinity as a signed symbol', () => {
    for (const infinity of ['-∞', String(-Infinity), -Infinity] as const) {
      expect(displayNumber(infinity)).toEqual({
        primary: '-∞',
        secondary: undefined,
      });
    }
  });

  test('reports a zero denominator as its own failure', () => {
    expect(displayNumber('1/0')).toEqual({
      primary: '1/0',
      error: 'Cannot Divide "1/0" By Zero',
    });
  });

  test('reports input it cannot read as a number, echoing it back', () => {
    expect(displayNumber('half')).toEqual({
      primary: 'half',
      error: 'Cannot Parse "half" As A Number',
    });
    expect(displayNumber(NaN)).toEqual({
      primary: 'NaN',
      error: 'Cannot Parse "NaN" As A Number',
    });
  });

  test('carries a negative sign into both halves', () => {
    expect(displayNumber('-1/3')).toEqual({
      primary: '-1/3',
      secondary: '~-0.333',
    });
  });

  test('edge case: 0', () => {
    expect(displayNumber(0)).toEqual({
      primary: '0',
      secondary: undefined,
    });
  });
});

describe('average', () => {
  test('returns the average of a list of numbers', () => {
    expect(average([1, 2, 3, 4, 5])).toBe(3);
    expect(average([1, 2, 3, 4, 5, 6])).toBe(3.5);
  });

  test('edge case: empty list', () => {
    expect(average([])).toBe(0);
  });
});
