import Fraction from 'fraction.js';
import { describe, expect, it } from 'vitest';

import { getInvalidStates, getOutboundTotals } from './useChainValidity.ts';

const transition = (source: string, weight: string) => ({
  source,
  weight: new Fraction(weight),
});

const readable = (totals: Map<string, Fraction>) =>
  [...totals].map(([stateId, total]) => [stateId, total.toFraction()]);

describe('getOutboundTotals', () => {
  it('adds up what leaves each state', () => {
    const totals = getOutboundTotals(
      ['a', 'b'],
      [transition('a', '1/2'), transition('a', '1/4'), transition('b', '1')],
    );

    expect(readable(totals)).toEqual([
      ['a', '3/4'],
      ['b', '1'],
    ]);
  });

  it('adds thirds to exactly one, which decimals could not', () => {
    const totals = getOutboundTotals(
      ['a'],
      [transition('a', '1/3'), transition('a', '1/3'), transition('a', '1/3')],
    );

    expect(readable(totals)).toEqual([['a', '1']]);
  });

  it('leaves a state with no transitions at zero', () => {
    expect(readable(getOutboundTotals(['a'], []))).toEqual([['a', '0']]);
  });

  it('throws when a transition leaves a state the chain does not have', () => {
    expect(() => getOutboundTotals(['a'], [transition('b', '1')])).toThrow();
  });
});

describe('getInvalidStates', () => {
  it('accepts a state whose transitions sum to one', () => {
    const totals = new Map([['a', new Fraction(1)]]);

    expect(getInvalidStates(totals)).toEqual(new Set());
  });

  it('rejects a state with no transitions at all', () => {
    const totals = new Map([['a', new Fraction(0)]]);

    expect(getInvalidStates(totals)).toEqual(new Set(['a']));
  });

  it('rejects a state whose transitions overshoot one', () => {
    const totals = new Map([
      ['a', new Fraction('5/4')],
      ['b', new Fraction(1)],
    ]);

    expect(getInvalidStates(totals)).toEqual(new Set(['a']));
  });
});
