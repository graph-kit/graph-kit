import Fraction from 'fraction.js';

/**
 * the golden ratio constant.
 * {@link} https://en.wikipedia.org/wiki/Golden_ratio
 */
export const GOLDEN_RATIO = 1.618;

/**
 * rounds a number to the nearest multiple of another number
 *
 * @param n the number to round
 * @param nearest the number to round to
 * @returns the rounded number
 * @example const roundToNearest5 = roundToNearestN(5);
 * roundToNearest5(13) // 15
 * roundToNearest5(12) // 10
 */
export const roundToNearestN = (nearest: number) => (n: number) => {
  return Math.round(n / nearest) * nearest;
};

/**
 * get the prime factors of a number
 *
 * @param num the number to get the prime factors of
 * @returns the prime factors of the number
 * @example getPrimeFactors(12) // [2, 2, 3]
 * getPrimeFactors(15) // [3, 5]
 */
export const getPrimeFactors = (num: number) => {
  const factors: number[] = [];
  let divisor = 2;

  while (num >= 2) {
    if (num % divisor === 0) {
      factors.push(divisor);
      num = num / divisor;
    } else {
      divisor++;
    }
  }

  return factors;
};

/**
 * get the lowest prime factor of a number
 *
 * @param num the number to get the lowest prime factor of
 * @returns the lowest prime factor of the number
 * @example
 * lowestPrimeFactor(12) // 12 = 2 * 2 * 3, min(2, 2, 3) = 2
 * lowestPrimeFactor(15) // 15 = 3 * 5, min(3, 5) = 3
 */
export const lowestPrimeFactor = (num: number) => {
  if (num === 1) return 1; // 1 has no prime factors
  return Math.min(...getPrimeFactors(num));
};

/**
 * get the greatest common divisor of two numbers.
 * {@link} https://en.wikipedia.org/wiki/Euclidean_algorithm
 * {@link} https://en.wikipedia.org/wiki/Greatest_common_divisor
 *
 * @param a the first number
 * @param b the second number
 * @returns the greatest common divisor of the two numbers
 * @example gcd(12, 15) // 3
 * gcd(12, 18) // 6
 */
export const gcd = (a: number, b: number): number => {
  if (b === 0) return a;
  return gcd(b, a % b);
};

/**
 * check if two numbers are within a certain tolerance of each other
 */
export const within = (tolerance: number) => (a: number, b: number) => {
  return Math.abs(a - b) <= tolerance;
};

/**
 * formats a fraction as a decimal, prefixing a tilde when rounding lost
 * precision
 *
 * @param fraction the fraction to format
 * @param fractionDigits how many decimal places to keep
 * @returns the formatted fraction, tilde prefixed if it was rounded
 * @example fractionToDecimal(new Fraction(5, 2)) // '2.5'
 * fractionToDecimal(new Fraction(1, 3)) // '~0.333'
 * fractionToDecimal(new Fraction(1, 3), 1) // '~0.3'
 */
export const fractionToDecimal = (fraction: Fraction, fractionDigits = 3) => {
  const rounded = fraction.round(fractionDigits);
  return `${rounded.equals(fraction) ? '' : '~'}${rounded.valueOf()}`;
};

/**
 * check if a fraction can be expressed as an integer
 *
 * @param fraction the fraction to check
 * @returns true if the fraction has no fractional part
 * @example fractionIsInteger(new Fraction(4, 2)) // true
 * fractionIsInteger(new Fraction(1, 3)) // false
 */
export const fractionIsInteger = (fraction: Fraction) => {
  // fraction.js keeps fractions reduced, so a denominator of 1 means integer
  return fraction.d === 1n;
};

export const isFractionDivisionByZero = (error: unknown) =>
  error instanceof Error && error.message === 'Division by Zero';

export type DisplayNumber = {
  primary: string;
  secondary?: string;
};

export type DisplayNumberErrorReason = 'divide-by-zero' | 'unparseable';

export type DisplayNumberError = {
  error: DisplayNumberErrorReason;
  raw: string;
};

const displayFraction = (
  fraction: Fraction,
  approximationDigits?: number,
): DisplayNumber => ({
  primary: fraction.toFraction(),
  secondary: fractionIsInteger(fraction)
    ? undefined
    : fractionToDecimal(fraction, approximationDigits),
});

const INFINITY_TEXTS = ['∞', String(Infinity)];
const NEGATIVE_INFINITY_TEXTS = INFINITY_TEXTS.map((text) => `-${text}`);

/**
 * formats number into main user-facing number and secondary decimal approximation
 *
 * @param valueToDisplay the number, written as a decimal, a `numerator/denominator`
 * string, a symbol like `∞`, or a Fraction
 * @param approximationDigits how many decimal places the approximation keeps
 * @returns the primary and secondary forms, or, for a number or string that
 * could not be read, an `error` reason alongside the input that carried it,
 * narrowed apart with `'error' in`. a Fraction is already built, so it cannot
 * fail and needs no narrowing
 * @example displayNumber('1/3') // '1/3' and '~0.333'
 * displayNumber(Infinity) // '∞', the symbol needs no decimal
 * displayNumber('1/0') // errors, 'divide-by-zero'
 * displayNumber('half') // errors, 'unparseable'
 */
export function displayNumber(
  valueToDisplay: Fraction,
  approximationDigits?: number,
): DisplayNumber;
export function displayNumber(
  valueToDisplay: number | string,
  approximationDigits?: number,
): DisplayNumber | DisplayNumberError;
export function displayNumber(
  valueToDisplay: number | string | Fraction,
  approximationDigits?: number,
): DisplayNumber | DisplayNumberError {
  if (valueToDisplay instanceof Fraction)
    return displayFraction(valueToDisplay, approximationDigits);

  const raw = String(valueToDisplay).trim();

  if (INFINITY_TEXTS.includes(raw)) return { primary: '∞' };
  if (NEGATIVE_INFINITY_TEXTS.includes(raw)) return { primary: '-∞' };

  let fraction: Fraction;
  try {
    // numbers go in unstringified, fraction.js reads 1e-7 but not '1e-7'
    fraction = new Fraction(
      typeof valueToDisplay === 'string' ? raw : valueToDisplay,
    );
  } catch (error) {
    return {
      error: isFractionDivisionByZero(error) ? 'divide-by-zero' : 'unparseable',
      raw,
    };
  }

  return displayFraction(fraction, approximationDigits);
}

/**
 * get the average of an array of numbers
 *
 * @param arr the array of numbers to average
 * @returns the average of the array
 * @example average([1, 2, 3]) // 2
 * average([1, 2, 3, 4]) // 2.5
 */
export const average = (arr: number[]) => {
  if (arr.length === 0) return 0;
  return arr.reduce((acc, val) => acc + val, 0) / arr.length;
};
