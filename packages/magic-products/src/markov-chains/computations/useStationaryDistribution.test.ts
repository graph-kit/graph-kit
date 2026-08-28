import Fraction from 'fraction.js';
import { describe, expect, it } from 'vitest';

import {
  isStationaryDistributionReached,
  isStationaryDistributionUnique,
  solveStationaryDistribution,
  toClassSystem,
  toDistribution,
} from './useStationaryDistribution.ts';

const matrix = (rows: string[][]) =>
  rows.map((row) => row.map((entry) => new Fraction(entry)));

const readable = (solution: Fraction[]) =>
  solution.map((entry) => entry.toFraction());

describe('isStationaryDistributionUnique', () => {
  it('is true for a valid chain with one recurrent class', () => {
    expect(isStationaryDistributionUnique([new Set(['a', 'b'])], true)).toBe(
      true,
    );
  });

  it('is false once the chain can settle in more than one place', () => {
    expect(
      isStationaryDistributionUnique([new Set(['a']), new Set(['b'])], true),
    ).toBe(false);
  });

  it('is false for a chain whose transitions are not probabilities', () => {
    expect(isStationaryDistributionUnique([new Set(['a', 'b'])], false)).toBe(
      false,
    );
  });
});

describe('isStationaryDistributionReached', () => {
  it('is true for an aperiodic chain with one distribution to reach', () => {
    expect(isStationaryDistributionReached([1], true)).toBe(true);
  });

  it('is false for a periodic chain, which has one but never sits at it', () => {
    expect(isStationaryDistributionReached([2], true)).toBe(false);
  });

  it('is false when there is no unique distribution to reach', () => {
    expect(isStationaryDistributionReached([1, 1], false)).toBe(false);
  });
});

describe('toClassSystem', () => {
  it('keeps the rows and columns of the class and nothing else', () => {
    const system = toClassSystem(
      matrix([
        ['0', '1/2', '1/2'],
        ['0', '1', '0'],
        ['1/4', '0', '3/4'],
      ]),
      ['a', 'b', 'c'],
      new Set(['a', 'c']),
    );

    expect(system.states).toEqual(['a', 'c']);
    expect(system.matrix.map(readable)).toEqual([
      ['0', '1/2'],
      ['1/4', '3/4'],
    ]);
  });
});

describe('solveStationaryDistribution', () => {
  it('gives an absorbing state all of the probability', () => {
    expect(readable(solveStationaryDistribution(matrix([['1']])))).toEqual([
      '1',
    ]);
  });

  it('splits a class that can only alternate evenly', () => {
    const solution = solveStationaryDistribution(
      matrix([
        ['0', '1'],
        ['1', '0'],
      ]),
    );

    expect(readable(solution)).toEqual(['1/2', '1/2']);
  });

  it('weights a state by how often the chain returns to it', () => {
    const solution = solveStationaryDistribution(
      matrix([
        ['1/2', '1/2'],
        ['1/4', '3/4'],
      ]),
    );

    expect(readable(solution)).toEqual(['1/3', '2/3']);
  });

  it('holds the answer in exact fractions', () => {
    const solution = solveStationaryDistribution(
      matrix([
        ['1/3', '2/3'],
        ['1', '0'],
      ]),
    );

    expect(readable(solution)).toEqual(['3/5', '2/5']);
  });

  it('spreads a cycle evenly across its states', () => {
    const solution = solveStationaryDistribution(
      matrix([
        ['0', '1', '0'],
        ['0', '0', '1'],
        ['1', '0', '0'],
      ]),
    );

    expect(readable(solution)).toEqual(['1/3', '1/3', '1/3']);
  });

  it('solves a class whose states are reached at different rates', () => {
    const solution = solveStationaryDistribution(
      matrix([
        ['0', '1', '0'],
        ['1/2', '0', '1/2'],
        ['0', '1', '0'],
      ]),
    );

    expect(readable(solution)).toEqual(['1/4', '1/2', '1/4']);
  });

  it('returns a distribution that sums to one', () => {
    const solution = solveStationaryDistribution(
      matrix([
        ['1/2', '1/4', '1/4'],
        ['1/3', '1/3', '1/3'],
        ['0', '1/2', '1/2'],
      ]),
    );

    const total = solution.reduce(
      (sum, entry) => sum.add(entry),
      new Fraction(0),
    );

    expect(total.equals(1)).toBe(true);
  });

  it('throws when the class was never a single recurrent one', () => {
    expect(() =>
      solveStationaryDistribution(
        matrix([
          ['1', '0'],
          ['0', '1'],
        ]),
      ),
    ).toThrow();
  });
});

describe('toDistribution', () => {
  it('leaves every transient state at zero', () => {
    const distribution = toDistribution(
      ['a', 'b', 'c'],
      ['b', 'c'],
      [new Fraction('1/4'), new Fraction('3/4')],
    );

    expect(
      [...distribution].map(([stateId, entry]) => [
        stateId,
        entry.toFraction(),
      ]),
    ).toEqual([
      ['a', '0'],
      ['b', '1/4'],
      ['c', '3/4'],
    ]);
  });
});
