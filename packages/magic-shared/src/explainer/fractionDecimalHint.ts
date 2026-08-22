import { fractionIsInteger, fractionToDecimal } from '@core/utils/math';
import Fraction from 'fraction.js';

/**
 * the decimal worth showing alongside a fraction, or undefined when the
 * fraction is already an integer and there is nothing to approximate
 *
 * @param fraction the fraction to approximate
 * @param fractionDigits how many decimal places to keep
 * @returns the formatted decimal, or undefined for integers
 * @example fractionDecimalHint(new Fraction(4, 2)) // undefined
 * fractionDecimalHint(new Fraction(5, 2)) // '2.5'
 * fractionDecimalHint(new Fraction(1, 3)) // '~0.333'
 */
export const fractionDecimalHint = (
  fraction: Fraction,
  fractionDigits?: number,
) => {
  if (fractionIsInteger(fraction)) return undefined;
  return fractionToDecimal(fraction, fractionDigits);
};
