import { describe, expect, test } from 'vitest';

import {
  BLACK,
  GRAY_50,
  GRAY_900,
  WHITE,
  YELLOW_400,
  contrastingTextColor,
} from './colors.ts';

describe('contrastingTextColor', () => {
  test('picks the opposite end of the scale for black and white', () => {
    expect(contrastingTextColor(WHITE)).toBe(BLACK);
    expect(contrastingTextColor(BLACK)).toBe(WHITE);
  });

  test('weighs luminance rather than raw brightness', () => {
    // yellow reads bright despite maxing only two channels, blue reads dark
    // despite maxing one, so a naive channel average would get both wrong
    expect(contrastingTextColor(YELLOW_400)).toBe(BLACK);
    expect(contrastingTextColor('#0000ff')).toBe(WHITE);
  });

  test('reads palette colors from either end', () => {
    expect(contrastingTextColor(GRAY_50)).toBe(BLACK);
    expect(contrastingTextColor(GRAY_900)).toBe(WHITE);
  });

  test('accepts the shorthand and hashless hex forms', () => {
    expect(contrastingTextColor('#fff')).toBe(BLACK);
    expect(contrastingTextColor('#000')).toBe(WHITE);
    expect(contrastingTextColor('ffffff')).toBe(BLACK);
  });

  test('lands on either side of the threshold where the two contrasts meet', () => {
    // the crossover falls between these two grays, one step apart
    expect(contrastingTextColor('#757575')).toBe(WHITE);
    expect(contrastingTextColor('#767676')).toBe(BLACK);
  });

  test('falls back to white on hex it cannot parse', () => {
    expect(contrastingTextColor('rebeccapurple')).toBe(WHITE);
    expect(contrastingTextColor('')).toBe(WHITE);
  });
});
