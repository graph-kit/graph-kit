import type { Coordinate } from '@canvas/primitives/types/utility';
import type { EventMapToEventRegistry } from '@core/events/types';

import type { Annotation, InFlightStroke } from './types.ts';

export type AnnotationsChange = {
  added: Annotation[];
  /**
   * the annotations themselves rather than their ids, so a change is enough to undo on
   * its own: a stroke is only ever added or removed, never edited
   */
  removed: Annotation[];
};

export type AnnotationsEventMap = {
  /**
   * when the set of committed annotations changes, whatever caused it: a finished
   * stroke, an eraser pass, a clear, or a write from somewhere else entirely
   */
  onAnnotationsChanged: (change: Readonly<AnnotationsChange>) => void;

  /**
   * the tools came out of standby. paired with onDeactivated rather than carrying the
   * flag, since a listener that cares about one edge rarely cares about the other
   */
  onActivated: () => void;
  /** the tools went back to standby, dropping whatever stroke was in flight */
  onDeactivated: () => void;

  onStrokeBegan: (stroke: Readonly<InFlightStroke>) => void;
  /** only the points added since the last trigger, never the whole stroke */
  onStrokeExtended: (points: readonly Coordinate[]) => void;
  /** the stroke is over, whether it committed or was abandoned */
  onStrokeEnded: () => void;
};

type AnnotationsEventRegistry = EventMapToEventRegistry<AnnotationsEventMap>;

export const createAnnotationsEventRegistry = (): AnnotationsEventRegistry => ({
  onAnnotationsChanged: new Set(),
  onActivated: new Set(),
  onDeactivated: new Set(),
  onStrokeBegan: new Set(),
  onStrokeExtended: new Set(),
  onStrokeEnded: new Set(),
});
