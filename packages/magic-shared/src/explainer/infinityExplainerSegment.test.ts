import { getValue } from '@core/utils/maybeGetter/index';
import { describe, expect, test } from 'vitest';

import {
  infinityExplainerSegment,
  isExplainerInfinity,
} from './infinityExplainerSegment.ts';

describe(isExplainerInfinity, () => {
  test('reads both the character and the number', () => {
    expect(isExplainerInfinity('∞')).toBe(true);
    expect(isExplainerInfinity(`${Infinity}`)).toBe(true);
    expect(isExplainerInfinity(' ∞ ')).toBe(true);
  });

  test('leaves fractions alone', () => {
    expect(isExplainerInfinity('1/3')).toBe(false);
    expect(isExplainerInfinity('')).toBe(false);
  });
});

describe(infinityExplainerSegment, () => {
  test('shows the character, hovering to reveal the word', () => {
    const segment = infinityExplainerSegment();
    expect(getValue(segment.text)).toBe('∞');
    expect(segment.highlight?.tooltipLabel).toBe('Infinity');
  });
});
