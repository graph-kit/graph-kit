import Fraction from 'fraction.js';
import { describe, expect, test } from 'vitest';

import {
  average,
  fractionDecimalHintText,
  fractionIsInteger,
  fractionToDecimal,
  fractionWithDecimalText,
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

describe('fractionDecimalHint', () => {
  test('returns undefined for fractions that reduce to an integer', () => {
    expect(fractionDecimalHintText(new Fraction(3))).toBeUndefined();
    expect(fractionDecimalHintText(new Fraction(4, 2))).toBeUndefined();
    expect(fractionDecimalHintText(new Fraction(0))).toBeUndefined();
  });

  test('returns the decimal for fractions with a fractional part', () => {
    expect(fractionDecimalHintText(new Fraction(5, 2))).toBe('2.5');
    expect(fractionDecimalHintText(new Fraction(1, 3))).toBe('~0.333');
  });

  test('respects the requested precision', () => {
    expect(fractionDecimalHintText(new Fraction(1, 3), 1)).toBe('~0.3');
  });
});

describe('fractionWithDecimal', () => {
  test('returns just the fraction when it is an integer', () => {
    expect(fractionWithDecimalText(new Fraction(4, 2))).toBe('2');
  });

  test('appends the decimal when there is one', () => {
    expect(fractionWithDecimalText(new Fraction(1, 3))).toBe('1/3 (~0.333)');
    expect(fractionWithDecimalText(new Fraction(5, 2))).toBe('5/2 (2.5)');
  });

  test('respects the requested precision', () => {
    expect(fractionWithDecimalText(new Fraction(1, 3), 1)).toBe('1/3 (~0.3)');
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
