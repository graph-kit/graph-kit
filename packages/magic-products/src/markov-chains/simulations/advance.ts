import { assert } from '@core/utils/assert';
import Fraction from 'fraction.js';

/**
 * one transition of the chain. the chance of landing on a state is everything
 * every other state sends into it, so this is the distribution times the matrix
 */
export const advance = (
  distribution: Fraction[],
  matrix: Fraction[][],
): Fraction[] => {
  assert(
    distribution.length === matrix.length,
    'distribution does not cover every state of the chain',
  );

  return distribution.map((_, to) => {
    let arriving = new Fraction(0);
    for (const [from, probability] of distribution.entries()) {
      arriving = arriving.add(probability.mul(matrix[from][to]));
    }
    return arriving;
  });
};
