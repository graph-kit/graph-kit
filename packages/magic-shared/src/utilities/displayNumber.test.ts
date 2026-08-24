import Fraction from 'fraction.js';
import { describe, expect, test } from 'vitest';

import { displayNumber } from './displayNumber.ts';

describe(displayNumber, () => {
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

  test('edge case: 0', () => {
    expect(displayNumber(0)).toEqual({
      primary: '0',
      secondary: undefined,
    });
  });
});
