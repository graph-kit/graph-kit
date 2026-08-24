import type { Coordinate } from '@canvas/primitives/types/utility';

import {
  LASER_DECAY_MS,
  LASER_HOLD_MS,
  LASER_TRAIL_LENGTH,
} from './constants.ts';

const distance = (from: Coordinate, to: Coordinate) =>
  Math.hypot(to.x - from.x, to.y - from.y);

/** the share of {@link LASER_TRAIL_LENGTH} still owed to a cursor this long stopped */
const remaining = (msSinceLastMove: number) => {
  const decaying = msSinceLastMove - LASER_HOLD_MS;
  if (decaying <= 0) return 1;
  return Math.max(0, 1 - decaying / LASER_DECAY_MS);
};

/**
 * the last {@link LASER_TRAIL_LENGTH} of stroke behind the cursor, held whole for
 * {@link LASER_HOLD_MS} once it stops and shrinking away over {@link LASER_DECAY_MS}.
 *
 * a function of elapsed time rather than a timer, because whoever is watching a laser is
 * not always whoever is holding it: a receiver has the points and no `lastMoveTime`.
 */
export const laserTrail = (
  points: readonly Coordinate[],
  msSinceLastMove: number,
): Coordinate[] => {
  if (points.length === 0) return [];

  const head = points[points.length - 1];
  const budget = LASER_TRAIL_LENGTH * remaining(msSinceLastMove);

  // a dot rather than nothing, under a cursor still pointing at something
  if (budget <= 0) return [head];

  const trail = [head];
  let spent = 0;

  for (let i = points.length - 1; i > 0; i--) {
    const segment = distance(points[i - 1], points[i]);

    if (spent + segment >= budget) {
      // ends where the budget ran out, not at the vertex before it, which would step the
      // tail a whole frame of cursor travel at a time
      const reach = (budget - spent) / segment;
      trail.unshift({
        x: points[i].x + (points[i - 1].x - points[i].x) * reach,
        y: points[i].y + (points[i - 1].y - points[i].y) * reach,
      });
      return trail;
    }

    spent += segment;
    trail.unshift(points[i - 1]);
  }

  return trail;
};
