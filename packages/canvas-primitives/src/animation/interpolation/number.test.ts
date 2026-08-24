import { describe, expect, test } from 'vitest';

import { EASING_PRESETS } from '../easing.ts';
import { interpolateNumber } from './number.ts';
import type { NumberKeyframe } from './types.ts';

const { linear, in: easeIn } = EASING_PRESETS;

describe('interpolateNumber', () => {
  test('falls back when there are no keyframes', () => {
    expect(interpolateNumber([], linear, 42)(0.5)).toBe(42);
  });

  test('walks a straight line between two keyframes', () => {
    const keyframes: NumberKeyframe[] = [
      { progress: 0, value: 0 },
      { progress: 1, value: 10 },
    ];
    const valueAt = interpolateNumber(keyframes, linear, 0);

    expect(valueAt(0)).toBe(0);
    expect(valueAt(0.25)).toBe(2.5);
    expect(valueAt(0.5)).toBe(5);
    expect(valueAt(1)).toBe(10);
  });

  test('counts down as happily as it counts up', () => {
    const keyframes: NumberKeyframe[] = [
      { progress: 0, value: 100 },
      { progress: 1, value: -100 },
    ];

    expect(interpolateNumber(keyframes, linear, 0)(0.5)).toBe(0);
  });

  test('holds the nearest keyframe outside the keyframe range', () => {
    const keyframes: NumberKeyframe[] = [
      { progress: 0.25, value: 10 },
      { progress: 0.75, value: 20 },
    ];
    const valueAt = interpolateNumber(keyframes, linear, 999);

    expect(valueAt(0)).toBe(10);
    expect(valueAt(0.25)).toBe(10);
    expect(valueAt(0.75)).toBe(20);
    expect(valueAt(1)).toBe(20);
  });

  test('picks the segment the progress lands in', () => {
    const keyframes: NumberKeyframe[] = [
      { progress: 0, value: 0 },
      { progress: 0.5, value: 100 },
      { progress: 1, value: 0 },
    ];
    const valueAt = interpolateNumber(keyframes, linear, 0);

    expect(valueAt(0.25)).toBe(50);
    expect(valueAt(0.5)).toBe(100);
    expect(valueAt(0.75)).toBe(50);
  });

  test('restarts easing within each segment rather than across the whole run', () => {
    const keyframes: NumberKeyframe[] = [
      { progress: 0, value: 0 },
      { progress: 0.5, value: 10 },
      { progress: 1, value: 20 },
    ];
    const valueAt = interpolateNumber(keyframes, easeIn, 0);

    // 0.25 sits halfway through the first segment, so the same eased 0.5 (0.25
    // after easing) applies as it does halfway through the second
    expect(valueAt(0.25)).toBe(2.5);
    expect(valueAt(0.75)).toBe(12.5);
  });

  test('lets a keyframe override the default easing for the segment it opens', () => {
    const keyframes: NumberKeyframe[] = [
      { progress: 0, value: 0, easing: easeIn },
      { progress: 0.5, value: 10 },
      { progress: 1, value: 20 },
    ];
    const valueAt = interpolateNumber(keyframes, linear, 0);

    expect(valueAt(0.25)).toBe(2.5);
    expect(valueAt(0.75)).toBe(15);
  });
});
