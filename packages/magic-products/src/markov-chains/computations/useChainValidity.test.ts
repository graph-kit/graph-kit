import Fraction from 'fraction.js';
import { describe, expect, it } from 'vitest';

import { getInvalidStates } from './useChainValidity.ts';

const transition = (source: string, weight: string) => ({
  source,
  weight: new Fraction(weight),
});

describe('getInvalidStates', () => {
  it('accepts a state whose transitions sum to one', () => {
    const invalidStates = getInvalidStates(
      ['a'],
      [transition('a', '1/2'), transition('a', '1/2')],
    );

    expect(invalidStates).toEqual(new Set());
  });

  it('accepts thirds, which decimals could not sum to exactly one', () => {
    const invalidStates = getInvalidStates(
      ['a'],
      [transition('a', '1/3'), transition('a', '1/3'), transition('a', '1/3')],
    );

    expect(invalidStates).toEqual(new Set());
  });

  it('rejects a state with no transitions at all', () => {
    expect(getInvalidStates(['a'], [])).toEqual(new Set(['a']));
  });

  it('rejects a state whose transitions overshoot one', () => {
    const invalidStates = getInvalidStates(
      ['a', 'b'],
      [transition('a', '1/2'), transition('a', '3/4'), transition('b', '1')],
    );

    expect(invalidStates).toEqual(new Set(['a']));
  });

  it('throws when a transition leaves a state the chain does not have', () => {
    expect(() => getInvalidStates(['a'], [transition('b', '1')])).toThrow();
  });
});
