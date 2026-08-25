import { afterEach, describe, expect, it } from 'vitest';

import {
  ANIMATION_SPEEDS,
  ANIMATION_SPEED_DURATION_MS,
  ANIMATION_SPEED_ICON,
  durationMsToString,
  readAnimationSpeed,
  writeAnimationSpeed,
} from './speeds.ts';

afterEach(() => localStorage.clear());

describe('ANIMATION_SPEEDS', () => {
  it('runs slowest to fastest, so the menu reads in one direction', () => {
    const durations = ANIMATION_SPEEDS.map(
      (speed) => ANIMATION_SPEED_DURATION_MS[speed],
    );
    expect(durations).toEqual([3000, 1000, 500, 300, 100]);
  });

  it('gives every speed an icon of its own', () => {
    const icons = ANIMATION_SPEEDS.map((speed) => ANIMATION_SPEED_ICON[speed]);
    expect(new Set(icons).size).toBe(ANIMATION_SPEEDS.length);
  });
});

describe('durationMsToString', () => {
  it('says seconds rather than milliseconds', () => {
    expect(durationMsToString(3000)).toBe('3 Seconds');
    expect(durationMsToString(500)).toBe('0.5 Seconds');
    expect(durationMsToString(100)).toBe('0.1 Seconds');
  });

  it('drops the plural for exactly one second', () => {
    expect(durationMsToString(1000)).toBe('1 Second');
  });
});

describe('reading back a saved speed', () => {
  it('answers with what was written', () => {
    writeAnimationSpeed('Fastest');
    expect(readAnimationSpeed()).toBe('Fastest');
  });

  it('answers with nothing when this browser never chose', () => {
    expect(readAnimationSpeed()).toBeUndefined();
  });

  it('refuses a stored value that is no longer a speed', () => {
    localStorage.setItem('animation-speed', 'Blistering');
    expect(readAnimationSpeed()).toBeUndefined();
  });

  it('refuses a stored value that only inherits off Object', () => {
    localStorage.setItem('animation-speed', 'toString');
    expect(readAnimationSpeed()).toBeUndefined();
  });
});
