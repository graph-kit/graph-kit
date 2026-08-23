import { describe, expect, it } from 'vitest';

import {
  LASER_DECAY_MS,
  LASER_HOLD_MS,
  LASER_TRAIL_LENGTH,
} from './constants.ts';
import { laserTrail } from './laserTrail.ts';

type Coordinate = { x: number; y: number };

/** a straight run along x, one point per frame of cursor travel */
const points = (count: number, spacing = 1) =>
  Array.from({ length: count }, (_, i) => ({ x: i * spacing, y: 0 }));

const length = (trail: Coordinate[]) =>
  trail.reduce(
    (total, point, i) =>
      i === 0
        ? 0
        : total +
          Math.hypot(point.x - trail[i - 1].x, point.y - trail[i - 1].y),
    0,
  );

describe('laserTrail', () => {
  it('shows every point of a stroke shorter than the trail reaches', () => {
    const stroke = points(3);
    expect(laserTrail(stroke, 0)).toEqual(stroke);
  });

  it('cuts the trail to the same length however far the cursor moved per frame', () => {
    const crawled = laserTrail(points(200, 2), 0);
    const flicked = laserTrail(points(20, 40), 0);

    expect(length(crawled)).toBeCloseTo(LASER_TRAIL_LENGTH);
    expect(length(flicked)).toBeCloseTo(LASER_TRAIL_LENGTH);
  });

  it('ends the trail inside a segment rather than at the vertex before it', () => {
    const trail = laserTrail(points(20, 40), 0);
    const [tail] = trail;

    expect(tail.x % 40).not.toBe(0);
  });

  it('holds the trail whole through a pause short enough to be a hand', () => {
    const stroke = points(200, 2);
    expect(laserTrail(stroke, LASER_HOLD_MS)).toEqual(laserTrail(stroke, 0));
  });

  it('bleeds the trail off continuously once past the hold', () => {
    const stroke = points(200, 2);

    const quarter = laserTrail(stroke, LASER_HOLD_MS + LASER_DECAY_MS * 0.25);
    const half = laserTrail(stroke, LASER_HOLD_MS + LASER_DECAY_MS * 0.5);

    expect(length(quarter)).toBeCloseTo(LASER_TRAIL_LENGTH * 0.75);
    expect(length(half)).toBeCloseTo(LASER_TRAIL_LENGTH * 0.5);
  });

  it('leaves a dot rather than nothing under a cursor that is still pointing', () => {
    const stroke = points(5);
    expect(laserTrail(stroke, LASER_HOLD_MS + LASER_DECAY_MS)).toEqual(
      stroke.slice(-1),
    );
  });

  it('has nothing to show for a stroke with no points', () => {
    expect(laserTrail([], LASER_DECAY_MS)).toEqual([]);
  });

  it('survives a stroke that never moved off its first point', () => {
    const stroke = [
      { x: 5, y: 5 },
      { x: 5, y: 5 },
    ];
    expect(laserTrail(stroke, 0)).toEqual(stroke);
  });
});
