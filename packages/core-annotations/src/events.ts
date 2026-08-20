import type { EventMapToEventRegistry } from '@core/events/types';

import type { Annotation } from './types.ts';

export type AnnotationsChange = {
  added: Annotation[];
  removedIds: string[];
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
};

type AnnotationsEventRegistry = EventMapToEventRegistry<AnnotationsEventMap>;

export const createAnnotationsEventRegistry = (): AnnotationsEventRegistry => ({
  onAnnotationsChanged: new Set(),
  onActivated: new Set(),
  onDeactivated: new Set(),
});
