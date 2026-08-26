import { describe, expect, test } from 'vitest';

import { EASING_PRESETS } from '../easing.ts';
import { interpolateCoordinate } from './coordinate.ts';
import type { CoordinateKeyframe } from './types.ts';

const { linear, in: easeIn } = EASING_PRESETS;

describe('interpolateCoordinate', () => {
  test('falls back when there are no keyframes', () => {
    expect(interpolateCoordinate([], linear, { x: 5, y: 7 })(0.5)).toEqual({
      x: 5,
      y: 7,
    });
  });

  test('moves each axis independently', () => {
    const keyframes: CoordinateKeyframe[] = [
      { progress: 0, value: { x: 0, y: 100 } },
      { progress: 1, value: { x: 50, y: 0 } },
    ];
    const pointAt = interpolateCoordinate(keyframes, linear, { x: 0, y: 0 });

    expect(pointAt(0)).toEqual({ x: 0, y: 100 });
    expect(pointAt(0.5)).toEqual({ x: 25, y: 50 });
    expect(pointAt(1)).toEqual({ x: 50, y: 0 });
  });

  test('holds the nearest keyframe outside the keyframe range', () => {
    const keyframes: CoordinateKeyframe[] = [
      { progress: 0.25, value: { x: 10, y: 10 } },
      { progress: 0.75, value: { x: 20, y: 20 } },
    ];
    const pointAt = interpolateCoordinate(keyframes, linear, {
      x: 999,
      y: 999,
    });

    expect(pointAt(0)).toEqual({ x: 10, y: 10 });
    expect(pointAt(1)).toEqual({ x: 20, y: 20 });
  });

  test('travels a path through every keyframe', () => {
    const keyframes: CoordinateKeyframe[] = [
      { progress: 0, value: { x: 0, y: 0 } },
      { progress: 0.5, value: { x: 100, y: 0 } },
      { progress: 1, value: { x: 100, y: 100 } },
    ];
    const pointAt = interpolateCoordinate(keyframes, linear, { x: 0, y: 0 });

    expect(pointAt(0.25)).toEqual({ x: 50, y: 0 });
    expect(pointAt(0.5)).toEqual({ x: 100, y: 0 });
    expect(pointAt(0.75)).toEqual({ x: 100, y: 50 });
  });

  test('applies the default easing to both axes', () => {
    const keyframes: CoordinateKeyframe[] = [
      { progress: 0, value: { x: 0, y: 0 } },
      { progress: 1, value: { x: 100, y: 200 } },
    ];

    expect(
      interpolateCoordinate(keyframes, easeIn, { x: 0, y: 0 })(0.5),
    ).toEqual({ x: 25, y: 50 });
  });

  test('ignores per-keyframe easing (known gap)', () => {
    // splitting into x/y keyframes drops `easing`, unlike interpolateTextArea
    // which spreads the keyframe through. an eased keyframe here moves linearly
    const keyframes: CoordinateKeyframe[] = [
      { progress: 0, value: { x: 0, y: 0 }, easing: easeIn },
      { progress: 1, value: { x: 100, y: 100 } },
    ];

    expect(
      interpolateCoordinate(keyframes, linear, { x: 0, y: 0 })(0.5),
    ).toEqual({ x: 50, y: 50 });
  });
});
