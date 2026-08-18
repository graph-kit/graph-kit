import type { EventMapToEventRegistry } from '@graph/primitives/events/types';

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
};

type AnnotationsEventRegistry = EventMapToEventRegistry<AnnotationsEventMap>;

export const createAnnotationsEventRegistry = (): AnnotationsEventRegistry => ({
  onAnnotationsChanged: new Set(),
});
