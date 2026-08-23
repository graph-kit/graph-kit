import { scribble } from '@canvas/primitives/shapes/scribble/index';
import type { Coordinate } from '@canvas/primitives/types/utility';

import {
  ANNOTATION_IN_PROGRESS_PRIORITY,
  LASER_MAX_POINTS,
} from './constants.ts';
import { laserTrail } from './laserTrail.ts';
import type {
  Annotation,
  AnnotationCanvasElement,
  InFlightStroke,
} from './types.ts';

/**
 * one stroke as it is being made, whether the hand holding it is this client's or a peer's.
 * the laser's decay is stateful, so only one thing may own the buffer.
 */
export type StrokeInFlight = {
  /** the id it commits under */
  id: string;
  /** the whole stroke for a drawing, the live tail for a laser */
  points: () => Coordinate[];
  extend: (added: readonly Coordinate[]) => void;
  element: () => AnnotationCanvasElement | undefined;
  /** what it commits as, or nothing for a laser */
  committed: () => Annotation | undefined;
};

export const createStrokeInFlight = ({
  id,
  mode,
  points: seed,
  fillColor,
  brushWeight,
}: InFlightStroke): StrokeInFlight => {
  const isLaser = mode === 'laser';

  let points = [...seed];
  let lastMoveTime = Date.now();

  const extend = (added: readonly Coordinate[]) => {
    points.push(...added);
    if (isLaser && points.length > LASER_MAX_POINTS) {
      points = points.slice(-LASER_MAX_POINTS);
    }
    lastMoveTime = Date.now();
  };

  // the trim is written back, not just drawn: the next move puts the decay budget back to
  // full, and a buffer still holding the retreated points would redraw the whole path
  const visiblePoints = () => {
    if (!isLaser) return points;
    points = laserTrail(points, Date.now() - lastMoveTime);
    return points;
  };

  return {
    id,
    points: () => points,
    extend,

    element: () => {
      const visible = visiblePoints();
      if (visible.length === 0) return;

      return {
        // shared with the annotation that replaces it, so the handoff is by identity
        id,
        priority: ANNOTATION_IN_PROGRESS_PRIORITY,
        shape: scribble({
          type: 'draw',
          points: visible,
          fillColor,
          brushWeight,
        }),
      };
    },

    committed: () =>
      isLaser
        ? undefined
        : { id, type: 'draw', points, fillColor, brushWeight },
  };
};
