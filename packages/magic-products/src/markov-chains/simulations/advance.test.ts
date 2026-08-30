import Fraction from 'fraction.js';
import { describe, expect, it } from 'vitest';

import { advance } from './advance.ts';

const fractions = (...values: (number | string)[]) =>
  values.map((value) => new Fraction(value));

const matrix = (...rows: (number | string)[][]) =>
  rows.map((row) => fractions(...row));

const read = (distribution: Fraction[]) =>
  distribution.map((probability) => probability.toFraction());

describe('advance', () => {
  it('moves everything a state sends into its targets', () => {
    const chain = matrix([0, 1], [1, 0]);

    expect(read(advance(fractions(1, 0), chain))).toEqual(['0', '1']);
    expect(read(advance(fractions(0, 1), chain))).toEqual(['1', '0']);
  });

  it('splits a probability across the transitions leaving a state', () => {
    const chain = matrix(['1/2', '1/2'], [0, 1]);

    expect(read(advance(fractions(1, 0), chain))).toEqual(['1/2', '1/2']);
  });

  it('leaves a stationary distribution where it is', () => {
    const chain = matrix(['1/2', '1/2'], ['1/4', '3/4']);

    // the chain spends a third of its steps in the first state and two thirds in the second
    const stationary = fractions('1/3', '2/3');

    expect(read(advance(stationary, chain))).toEqual(['1/3', '2/3']);
  });

  it('holds an absorbing state forever', () => {
    const chain = matrix(['1/2', '1/2'], [0, 1]);

    let distribution = fractions(1, 0);
    for (let i = 0; i < 10; i++) distribution = advance(distribution, chain);

    expect(read(distribution)).toEqual(['1/1024', '1023/1024']);
  });

  it('keeps the total probability at one', () => {
    const chain = matrix(
      ['1/3', '1/3', '1/3'],
      ['1/2', 0, '1/2'],
      [0, '3/4', '1/4'],
    );

    let distribution = fractions('1/2', '1/2', 0);
    for (let i = 0; i < 25; i++) distribution = advance(distribution, chain);

    const total = distribution.reduce(
      (sum, probability) => sum.add(probability),
      new Fraction(0),
    );
    expect(total.equals(1)).toBe(true);
  });

  it('rejects a distribution that does not cover every state', () => {
    const chain = matrix([1]);

    expect(() => advance(fractions('1/2', '1/2'), chain)).toThrow();
  });
});
