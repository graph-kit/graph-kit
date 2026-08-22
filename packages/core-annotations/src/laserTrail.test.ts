import { describe, expect, it } from 'vitest';

import { LASER_DECAY_MS, LASER_TRAIL_LENGTH } from './constants.ts';
import { laserTrail } from './laserTrail.ts';

const points = (count: number) =>
  Array.from({ length: count }, (_, i) => ({ x: i, y: 0 }));

describe('laserTrail', () => {
  it('shows every point of a trail shorter than the cap', () => {
    const trail = points(3);
    expect(laserTrail(trail, 0)).toEqual(trail);
  });

  it('shows only the newest points once past the cap', () => {
    const trail = points(LASER_TRAIL_LENGTH + 5);

    const visible = laserTrail(trail, 0);

    expect(visible).toHaveLength(LASER_TRAIL_LENGTH);
    expect(visible).toEqual(trail.slice(-LASER_TRAIL_LENGTH));
  });

  it('holds the trail still while the cursor is moving', () => {
    const trail = points(5);
    expect(laserTrail(trail, LASER_DECAY_MS - 1)).toEqual(trail);
  });

  it('bleeds off a point per decay once the cursor stops', () => {
    const trail = points(5);

    expect(laserTrail(trail, LASER_DECAY_MS)).toEqual(trail.slice(1));
    expect(laserTrail(trail, LASER_DECAY_MS * 3)).toEqual(trail.slice(3));
  });

  it('leaves a dot rather than nothing under a cursor that is still pointing', () => {
    const trail = points(5);
    expect(laserTrail(trail, LASER_DECAY_MS * 1_000)).toEqual(trail.slice(-1));
  });

  it('has nothing to show for a stroke with no points', () => {
    expect(laserTrail([], LASER_DECAY_MS)).toEqual([]);
  });
});
