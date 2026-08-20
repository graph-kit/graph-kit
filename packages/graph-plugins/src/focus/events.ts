import { EventMapToEventRegistry } from '@core/events/types';

export type FocusEventMap = {
  /**
   * when focused elements change
   */
  onFocusChange: (
    newElementIds: ReadonlySet<string>,
    oldElementIds: ReadonlySet<string>,
  ) => void;
};

type FocusEventRegistry = EventMapToEventRegistry<FocusEventMap>;

export const createFocusEventRegistry = (): FocusEventRegistry => ({
  onFocusChange: new Set(),
});
