import Fraction from 'fraction.js';
import { describe, expect, it } from 'vitest';

import { satisfiesDetailedBalance } from './useReversibility.ts';

const matrix = (rows: string[][]) =>
  rows.map((row) => row.map((entry) => new Fraction(entry)));

const distribution = (shares: Record<string, string>) =>
  new Map(
    Object.entries(shares).map(([stateId, share]) => [
      stateId,
      new Fraction(share),
    ]),
  );

describe('satisfiesDetailedBalance', () => {
  it('holds for a chain that crosses each way as often', () => {
    const balanced = satisfiesDetailedBalance(
      matrix([
        ['1/2', '1/2'],
        ['1/4', '3/4'],
      ]),
      ['a', 'b'],
      distribution({ a: '1/3', b: '2/3' }),
    );

    expect(balanced).toBe(true);
  });

  it('holds for a chain that only steps to a neighbour', () => {
    const balanced = satisfiesDetailedBalance(
      matrix([
        ['0', '1', '0'],
        ['1/2', '0', '1/2'],
        ['0', '1', '0'],
      ]),
      ['a', 'b', 'c'],
      distribution({ a: '1/4', b: '1/2', c: '1/4' }),
    );

    expect(balanced).toBe(true);
  });

  it('fails for a cycle that only turns one way', () => {
    const balanced = satisfiesDetailedBalance(
      matrix([
        ['0', '1', '0'],
        ['0', '0', '1'],
        ['1', '0', '0'],
      ]),
      ['a', 'b', 'c'],
      distribution({ a: '1/3', b: '1/3', c: '1/3' }),
    );

    expect(balanced).toBe(false);
  });

  it('holds vacuously over a state the chain never sits on', () => {
    const balanced = satisfiesDetailedBalance(
      matrix([
        ['0', '1'],
        ['0', '1'],
      ]),
      ['a', 'b'],
      distribution({ a: '0', b: '1' }),
    );

    expect(balanced).toBe(true);
  });
});
