import { EventMapToEventRegistry } from '@core/events/types';

export type AnimationEventMap = {
  /** the duration auto animated captures play at was changed */
  onAnimationDurationChanged: (
    newDurationMs: number,
    oldDurationMs: number,
  ) => void;
};

type AnimationEventRegistry = EventMapToEventRegistry<AnimationEventMap>;

export const createAnimationEventRegistry = (): AnimationEventRegistry => ({
  onAnimationDurationChanged: new Set(),
});
