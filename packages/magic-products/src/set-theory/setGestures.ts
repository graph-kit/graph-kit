import { createEventHub } from '@core/events/createEventHub';
import type { ReadonlyEventHub } from '@core/events/createEventHub';

import {
  type SetGestureEventMap,
  createSetGestureEventRegistry,
} from './events.ts';
import type { SetDefinitionId } from './types.ts';

export type SetGestures = {
  events: ReadonlyEventHub<SetGestureEventMap>;
  /** true while any gesture holds this set */
  isHolding: (setId: SetDefinitionId) => boolean;
  /** what a gesture reports into, see `useCircleDrag` and `useCircleResize` */
  report: {
    held: (setId: SetDefinitionId) => void;
    released: (setId: SetDefinitionId) => void;
  };
};

export const createSetGestures = (): SetGestures => {
  const events = createEventHub(createSetGestureEventRegistry());

  // moving and resizing are separate gestures, so both can be live at once
  const heldSetIds = new Set<SetDefinitionId>();

  return {
    events,
    isHolding: (setId) => heldSetIds.has(setId),
    report: {
      held: (setId) => {
        heldSetIds.add(setId);
        events.emit('onGestureStarted', setId);
      },
      released: (setId) => {
        heldSetIds.delete(setId);
        events.emit('onGestureEnded', setId);
      },
    },
  };
};
