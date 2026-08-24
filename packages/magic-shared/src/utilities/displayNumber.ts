import { fractionIsInteger, fractionToDecimal } from '@core/utils/math';
import Fraction from 'fraction.js';

export type DisplayNumber = {
  /**
   * the number as it reads best: a fraction, or a symbol such as ∞. falls back
   * to the input as written when `error` is set
   */
  primary: string;
  /**
   * the decimal worth showing alongside `primary`, absent when it would add
   * nothing (an integer, or a symbol that speaks for itself)
   */
  secondary?: string;
  /** title cased reason the input could not be read, absent when it was read */
  error?: string;
};

const fractionDisplay = (
  fraction: Fraction,
  fractionDigits?: number,
): DisplayNumber => ({
  primary: fraction.toFraction(),
  secondary: fractionIsInteger(fraction)
    ? undefined
    : fractionToDecimal(fraction, fractionDigits),
});

const infinityTexts = ['∞', String(Infinity), Infinity];
const negativeInfinityTexts = infinityTexts.map((text) => `-${text}`);

/**
 * the two halves of a number worth putting on screen: the exact form to show,
 * and the decimal approximation to reveal beside it
 *
 * @param value the number, written as a decimal, a `numerator/denominator`
 * string, a symbol like `∞`, or an already built Fraction
 * @param fractionDigits how many decimal places the approximation keeps
 * @returns the primary and secondary forms, or an `error` saying why the input
 * could not be read
 * @example displayNumber('1/3') // '1/3' and '~0.333'
 * displayNumber(3.5) // '7/2' and '3.5'
 * displayNumber('4/2') // '2', nothing to approximate
 * displayNumber(Infinity) // '∞', the symbol needs no decimal
 * displayNumber('1/0') // errors, cannot divide by zero
 * displayNumber('half') // errors, cannot be parsed
 */
export const displayNumber = (
  value: number | string | Fraction,
  fractionDigits?: number,
): DisplayNumber => {
  if (value instanceof Fraction) return fractionDisplay(value, fractionDigits);

  const raw = typeof value === 'string' ? value.trim() : String(value);

  if (infinityTexts.includes(raw)) return { primary: '∞' };
  if (negativeInfinityTexts.includes(raw)) return { primary: '-∞' };

  let fraction: Fraction;
  try {
    // numbers go in unstringified so exponent notation and float noise (1e-7,
    // 0.30000000000000004) land where a reader expects
    fraction = new Fraction(typeof value === 'string' ? raw : value);
  } catch (error) {
    // fraction.js signals both failures with a plain Error, so the message is
    // the only thing separating a zero denominator from unreadable input
    const dividedByZero =
      error instanceof Error && error.message === 'Division by Zero';
    return {
      primary: raw,
      error: dividedByZero
        ? `Cannot Divide "${raw}" By Zero`
        : `Cannot Parse "${raw}" As A Number`,
    };
  }

  return fractionDisplay(fraction, fractionDigits);
};
