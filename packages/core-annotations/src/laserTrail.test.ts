import { describe, expect, it } from 'vitest';

import type { TrailPoint } from './laserTrail.ts';
import {
  appendResampled,
  taperRuns,
  trailLength,
  trimOlderThan,
  trimToLength,
} from './laserTrail.ts';

const segmentLengths = (trail: TrailPoint[]) =>
  trail
    .slice(1)
    .map(({ x, y }, i) => Math.hypot(x - trail[i].x, y - trail[i].y));

describe('laser trail', () => {
  it('breaks a long pointer jump into segments of one size', () => {
    const trail: TrailPoint[] = [{ x: 0, y: 0, at: 0 }];

    appendResampled(trail, { x: 100, y: 0, at: 100 }, 4);

    expect(segmentLengths(trail).every((len) => Math.abs(len - 4) < 1e-9)).toBe(
      true,
    );
    expect(trail.at(-1)).toEqual({ x: 100, y: 0, at: 100 });
  });

  it('spreads the sample time across the points it plants', () => {
    const trail: TrailPoint[] = [{ x: 0, y: 0, at: 0 }];

    appendResampled(trail, { x: 100, y: 0, at: 100 }, 50);

    expect(trail.map(({ at }) => at)).toEqual([0, 50, 100]);
  });

  it('holds a sample back until it is a whole segment away', () => {
    const trail: TrailPoint[] = [{ x: 0, y: 0, at: 0 }];

    appendResampled(trail, { x: 1, y: 0, at: 10 }, 4);

    expect(trail).toEqual([{ x: 0, y: 0, at: 0 }]);
  });

  it('cuts partway into a segment so the tail slides rather than steps', () => {
    const trail: TrailPoint[] = [
      { x: 0, y: 0, at: 0 },
      { x: 100, y: 0, at: 100 },
    ];

    trimOlderThan(trail, 70);

    expect(trail).toEqual([
      { x: 70, y: 0, at: 70 },
      { x: 100, y: 0, at: 100 },
    ]);
  });

  it('leaves a trail younger than the cutoff whole', () => {
    const trail: TrailPoint[] = [
      { x: 0, y: 0, at: 50 },
      { x: 10, y: 0, at: 60 },
    ];

    trimOlderThan(trail, 40);

    expect(trail).toHaveLength(2);
  });

  it('empties the trail once every point is older than the cutoff', () => {
    const trail: TrailPoint[] = [
      { x: 0, y: 0, at: 0 },
      { x: 10, y: 0, at: 10 },
    ];

    trimOlderThan(trail, 20);

    expect(trail).toEqual([]);
  });

  it('gives a fast drag a longer tail than a slow one for the same window', () => {
    const fast: TrailPoint[] = [{ x: 0, y: 0, at: 0 }];
    const slow: TrailPoint[] = [{ x: 0, y: 0, at: 0 }];

    appendResampled(fast, { x: 600, y: 0, at: 100 }, 4);
    appendResampled(slow, { x: 40, y: 0, at: 100 }, 4);
    trimOlderThan(fast, 20);
    trimOlderThan(slow, 20);

    expect(trailLength(fast)).toBeGreaterThan(trailLength(slow) * 10);
  });

  it('caps what a single violent flick can paint, keeping the head', () => {
    const trail: TrailPoint[] = [{ x: 0, y: 0, at: 0 }];

    appendResampled(trail, { x: 4000, y: 0, at: 30 }, 4);
    trimToLength(trail, 500);

    expect(trailLength(trail)).toBeCloseTo(500);
    expect(trail.at(-1)).toEqual({ x: 4000, y: 0, at: 30 });
    expect(trail[0].x).toBeCloseTo(3500);
  });

  it('plants a bounded number of points however far the pointer jumped', () => {
    const trail: TrailPoint[] = [{ x: 0, y: 0, at: 0 }];

    appendResampled(trail, { x: 1_000_000, y: 0, at: 30 }, 4);

    expect(trail.length).toBeLessThan(300);
    expect(trail.at(-1)).toEqual({ x: 1_000_000, y: 0, at: 30 });
  });

  it('reports whether a sample was far enough to plant anything', () => {
    const trail: TrailPoint[] = [{ x: 0, y: 0, at: 0 }];

    expect(appendResampled(trail, { x: 1, y: 0, at: 5 }, 4)).toBe(false);
    expect(appendResampled(trail, { x: 9, y: 0, at: 9 }, 4)).toBe(true);
  });

  it('splits the trail into runs that share their ends, so they paint as one', () => {
    const trail: TrailPoint[] = Array.from({ length: 13 }, (_, i) => ({
      x: i,
      y: 0,
      at: i,
    }));

    const runs = taperRuns(trail, 4);

    expect(runs).toHaveLength(4);
    expect(runs[0][0]).toEqual(trail[0]);
    expect(runs.at(-1)?.at(-1)).toEqual(trail.at(-1));
    runs.slice(1).forEach((run, i) => expect(run[0]).toEqual(runs[i].at(-1)));
  });

  it('keeps the runs joined when they do not divide evenly', () => {
    const trail: TrailPoint[] = Array.from({ length: 8 }, (_, i) => ({
      x: i,
      y: 0,
      at: i,
    }));

    const runs = taperRuns(trail, 6);

    expect(runs.length).toBeGreaterThan(0);
    expect(runs[0][0]).toEqual(trail[0]);
    expect(runs.at(-1)?.at(-1)).toEqual(trail.at(-1));
    runs.forEach((run) => expect(run.length).toBeGreaterThan(1));
    runs.slice(1).forEach((run, i) => expect(run[0]).toEqual(runs[i].at(-1)));
  });

  it('has nothing to taper until the trail is a line', () => {
    expect(taperRuns([{ x: 0, y: 0, at: 0 }], 6)).toEqual([]);
  });
});
