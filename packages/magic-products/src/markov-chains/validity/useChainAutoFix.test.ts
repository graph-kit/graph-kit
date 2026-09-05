import Fraction from 'fraction.js';
import { describe, expect, it } from 'vitest';

import { getWeightAdjustments } from './useChainAutoFix.ts';

const state = (id: string) => ({ id });

const transition = (id: string, source: string, weight: string) => ({
  id,
  source,
  weight: new Fraction(weight),
});

const readable = (adjustments: Map<string, Fraction>) =>
  [...adjustments].map(([edgeId, weight]) => [edgeId, weight.toFraction()]);

describe('getWeightAdjustments', () => {
  it('leaves a state whose transitions already add up to 1 alone', () => {
    const adjustments = getWeightAdjustments(
      [state('a')],
      [transition('one', 'a', '1/2'), transition('two', 'a', '1/2')],
    );

    expect(readable(adjustments)).toEqual([]);
  });

  it('gives a lone transition the whole 1', () => {
    const adjustments = getWeightAdjustments(
      [state('a')],
      [transition('one', 'a', '1/4')],
    );

    expect(readable(adjustments)).toEqual([['one', '1']]);
  });

  it('leaves a lone transition already at 1 alone', () => {
    const adjustments = getWeightAdjustments(
      [state('a')],
      [transition('one', 'a', '1')],
    );

    expect(readable(adjustments)).toEqual([]);
  });

  it('splits several transitions by their share of the total', () => {
    const adjustments = getWeightAdjustments(
      [state('a')],
      [transition('one', 'a', '1'), transition('two', 'a', '3')],
    );

    expect(readable(adjustments)).toEqual([
      ['one', '1/4'],
      ['two', '3/4'],
    ]);
  });

  it('flips a negative transition back above zero, magnitudes adding to 1 or not', () => {
    const adjustments = getWeightAdjustments(
      [state('a')],
      [transition('one', 'a', '-1/2'), transition('two', 'a', '1/2')],
    );

    expect(readable(adjustments)).toEqual([['one', '1/2']]);
  });

  it('splits a state evenly when every transition sits at 0', () => {
    const adjustments = getWeightAdjustments(
      [state('a')],
      [
        transition('one', 'a', '0'),
        transition('two', 'a', '0'),
        transition('three', 'a', '0'),
      ],
    );

    expect(readable(adjustments)).toEqual([
      ['one', '1/3'],
      ['two', '1/3'],
      ['three', '1/3'],
    ]);
  });

  it('passes over a state with nothing leaving it', () => {
    const adjustments = getWeightAdjustments([state('a')], []);

    expect(readable(adjustments)).toEqual([]);
  });

  it('touches only the transitions leaving the state that is off', () => {
    const adjustments = getWeightAdjustments(
      [state('a'), state('b')],
      [
        transition('one', 'a', '1'),
        transition('two', 'b', '1'),
        transition('three', 'b', '1'),
      ],
    );

    expect(readable(adjustments)).toEqual([
      ['two', '1/2'],
      ['three', '1/2'],
    ]);
  });
});
