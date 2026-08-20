import { EventMapToEventRegistry } from '@core/events/types';

export type HistoryEventMap = {
  /**
   * when the undo action is triggered
   */
  onUndo: () => void;
  /**
   * when the redo action is triggered
   */
  onRedo: () => void;
  onHistoryChanged: () => void;
};

type HistoryEventRegistry = EventMapToEventRegistry<HistoryEventMap>;

export const createHistoryEventRegistry = (): HistoryEventRegistry => ({
  onUndo: new Set(),
  onRedo: new Set(),
  onHistoryChanged: new Set(),
});
