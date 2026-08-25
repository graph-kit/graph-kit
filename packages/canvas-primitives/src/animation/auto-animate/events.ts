import { EventMapToEventRegistry } from '@core/events/types';

export type AutoAnimateEventMap = {
  /** the duration auto animated captures play at was changed */
  onAnimationDurationChanged: (
    newDurationMs: number,
    oldDurationMs: number,
  ) => void;
};

type AutoAnimateEventRegistry = EventMapToEventRegistry<AutoAnimateEventMap>;

export const createAutoAnimateEventRegistry = (): AutoAnimateEventRegistry => ({
  onAnimationDurationChanged: new Set(),
});
