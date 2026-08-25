import { describe, expect, test } from 'vitest';

import {
  EASING_PRESETS,
  type EasingPreset,
  easingOptionToFunction,
} from './easing.ts';

const presetNames = Object.keys(EASING_PRESETS) as EasingPreset[];

describe('EASING_PRESETS', () => {
  test('every preset starts at 0 and lands on 1', () => {
    for (const name of presetNames) {
      const easing = EASING_PRESETS[name];
      expect(easing(0), name).toBeCloseTo(0);
      expect(easing(1), name).toBeCloseTo(1);
    }
  });

  test('every preset climbs without ever going backwards', () => {
    for (const name of presetNames) {
      const easing = EASING_PRESETS[name];
      let previous = easing(0);
      for (let i = 1; i <= 100; i++) {
        const current = easing(i / 100);
        expect(current, `${name} at ${i / 100}`).toBeGreaterThanOrEqual(
          previous,
        );
        previous = current;
      }
    }
  });

  test('each curve sits where its name says at the midpoint', () => {
    expect(EASING_PRESETS.linear(0.5)).toBe(0.5);
    expect(EASING_PRESETS.in(0.5)).toBe(0.25);
    expect(EASING_PRESETS.out(0.5)).toBe(0.75);
    expect(EASING_PRESETS['in-out'](0.5)).toBe(0.5);
  });

  test('in-out is symmetric about its midpoint', () => {
    const easing = EASING_PRESETS['in-out'];
    for (let i = 0; i <= 50; i++) {
      const step = i / 100;
      expect(easing(step) + easing(1 - step)).toBeCloseTo(1);
    }
  });
});

describe('easingOptionToFunction', () => {
  test('looks up a preset by name', () => {
    expect(easingOptionToFunction('in')).toBe(EASING_PRESETS.in);
  });

  test('passes a custom function straight through', () => {
    const custom = (step: number) => step ** 3;
    expect(easingOptionToFunction(custom)).toBe(custom);
  });
});
