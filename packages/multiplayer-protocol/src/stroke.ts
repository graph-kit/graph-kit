import { PeerStroke, Point } from './room.ts';

/**
 * a laser only ever shows the tail behind the cursor, so the buffer is held near what can
 * be on screen. without a bound, a minute of pointing grows an array nobody will paint and
 * ships every point of it to the next person who joins
 */
const LASER_MAX_POINTS = 64;

/**
 * a drawing keeps all of itself, since every point of it is going to commit. this is a
 * valve against a client that never lifts the pointer, not a length anyone should reach
 */
const DRAWING_MAX_POINTS = 8_192;

const maxPoints = ({ mode }: PeerStroke) =>
  mode === 'laser' ? LASER_MAX_POINTS : DRAWING_MAX_POINTS;

/**
 * Accumulates a stroke delta. Shared rather than written on both sides, because the server
 * and every client hold the same stroke and have to agree on how much of it they keep.
 */
export const appendStrokePoints = (
  stroke: PeerStroke,
  points: Point[],
): void => {
  stroke.points.push(...points);

  const limit = maxPoints(stroke);
  if (stroke.points.length > limit) {
    stroke.points = stroke.points.slice(-limit);
  }
};
