import type { Coordinate } from '@canvas/primitives/types/utility';

import { LASER_DECAY_MS, LASER_TRAIL_LENGTH } from './constants.ts';

/**
 * the laser trail as of `msSinceLastMove`: capped to what stays on screen behind the
 * cursor, and bleeding off a point per {@link LASER_DECAY_MS} once the cursor has stopped.
 *
 * a function of elapsed time rather than a timer that mutates a buffer, because the draw
 * pass already reruns every frame and because whoever is watching a laser is not always
 * whoever is holding it: a receiver has the points and no `lastMoveTime` to run a timer off.
 */
export const laserTrail = (
  points: readonly Coordinate[],
  msSinceLastMove: number,
): Coordinate[] => {
  const visible = points.slice(-LASER_TRAIL_LENGTH);

  const decayed = Math.floor(msSinceLastMove / LASER_DECAY_MS);
  if (decayed < 1) return visible;

  // one point is always held back, so a laser standing still stays a dot rather than
  // vanishing out from under a cursor that is still very much pointing at something
  return visible.slice(Math.min(decayed, visible.length - 1));
};
