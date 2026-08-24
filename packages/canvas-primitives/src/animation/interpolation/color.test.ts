import { describe, expect, test } from 'vitest';

import { EASING_PRESETS } from '../easing.ts';
import { interpolateColor, isColorString } from './color.ts';
import type { ColorKeyframe } from './types.ts';

const { linear, in: easeIn } = EASING_PRESETS;

describe('isColorString', () => {
  test('accepts every notation a schema is allowed to carry', () => {
    expect(isColorString('#ff0000')).toBe(true);
    expect(isColorString('#f00')).toBe(true);
    expect(isColorString('red')).toBe(true);
    expect(isColorString('rgba(255, 0, 0, 0.5)')).toBe(true);
  });

  test('rejects strings that are not colors', () => {
    expect(isColorString('nonsense')).toBe(false);
    expect(isColorString('')).toBe(false);
  });
});

describe('interpolateColor', () => {
  test('falls back when there are no keyframes', () => {
    expect(interpolateColor([], linear, 'red')(0.5)).toBe('red');
  });

  test('blends channel by channel between two keyframes', () => {
    const keyframes: ColorKeyframe[] = [
      { progress: 0, value: '#ff0000' },
      { progress: 1, value: '#0000ff' },
    ];
    const colorAt = interpolateColor(keyframes, linear, '#000000');

    expect(colorAt(0)).toBe('rgb(255, 0, 0)');
    expect(colorAt(0.5)).toBe('rgb(128, 0, 128)');
    expect(colorAt(1)).toBe('rgb(0, 0, 255)');
  });

  test('blends alpha alongside the color channels', () => {
    const keyframes: ColorKeyframe[] = [
      { progress: 0, value: 'rgba(0, 0, 0, 0)' },
      { progress: 1, value: 'rgba(0, 0, 0, 1)' },
    ];

    expect(interpolateColor(keyframes, linear, 'black')(0.5)).toBe(
      'rgba(0, 0, 0, 0.5)',
    );
  });

  test('reads keyframes written in different notations', () => {
    const keyframes: ColorKeyframe[] = [
      { progress: 0, value: 'red' },
      { progress: 1, value: '#00f' },
    ];

    expect(interpolateColor(keyframes, linear, 'black')(0.5)).toBe(
      'rgb(128, 0, 128)',
    );
  });

  test('picks the segment the progress lands in', () => {
    const keyframes: ColorKeyframe[] = [
      { progress: 0, value: '#000000' },
      { progress: 0.5, value: '#ffffff' },
      { progress: 1, value: '#000000' },
    ];
    const colorAt = interpolateColor(keyframes, linear, 'red');

    expect(colorAt(0.25)).toBe('rgb(128, 128, 128)');
    expect(colorAt(0.5)).toBe('rgb(255, 255, 255)');
    expect(colorAt(0.75)).toBe('rgb(128, 128, 128)');
  });

  test('lets a keyframe override the default easing for the segment it opens', () => {
    const keyframes: ColorKeyframe[] = [
      { progress: 0, value: '#000000', easing: easeIn },
      { progress: 1, value: '#ffffff' },
    ];

    expect(interpolateColor(keyframes, linear, 'red')(0.5)).toBe(
      'rgb(64, 64, 64)',
    );
  });

  test('falls back outside the keyframe range instead of holding the nearest keyframe', () => {
    // unlike interpolateNumber, which clamps to the end keyframes. compiled
    // timelines always pad out to 0 and 1, so nothing hits this in practice
    const keyframes: ColorKeyframe[] = [
      { progress: 0.25, value: '#ff0000' },
      { progress: 0.75, value: '#0000ff' },
    ];
    const colorAt = interpolateColor(keyframes, linear, 'green');

    expect(colorAt(0)).toBe('green');
    expect(colorAt(1)).toBe('green');
  });

  test('throws on a keyframe that is not a color, rather than painting garbage', () => {
    const keyframes: ColorKeyframe[] = [
      { progress: 0, value: '#ff0000' },
      { progress: 1, value: 'not-a-color' },
    ];

    expect(() => interpolateColor(keyframes, linear, 'red')(0.5)).toThrow(
      'Invalid color provided in keyframe.',
    );
  });
});
