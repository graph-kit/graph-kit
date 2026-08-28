import Fraction from 'fraction.js';
import { describe, expect, it } from 'vitest';

import { toMeanRecurrenceTimes } from './useMeanRecurrenceTimes.ts';

const distribution = (shares: Record<string, string>) =>
  new Map(
    Object.entries(shares).map(([stateId, share]) => [
      stateId,
      new Fraction(share),
    ]),
  );

const readable = (times: Map<string, Fraction | undefined>) =>
  [...times].map(([stateId, time]) => [stateId, time?.toFraction()]);

describe('toMeanRecurrenceTimes', () => {
  it('returns to a state as often as it holds the distribution', () => {
    const times = toMeanRecurrenceTimes(distribution({ a: '1/3', b: '2/3' }));

    expect(readable(times)).toEqual([
      ['a', '3'],
      ['b', '3/2'],
    ]);
  });

  it('returns to an absorbing state every step', () => {
    expect(readable(toMeanRecurrenceTimes(distribution({ a: '1' })))).toEqual([
      ['a', '1'],
    ]);
  });

  it('never returns to a state the chain leaves for good', () => {
    const times = toMeanRecurrenceTimes(distribution({ a: '0', b: '1' }));

    expect(readable(times)).toEqual([
      ['a', undefined],
      ['b', '1'],
    ]);
  });
});
