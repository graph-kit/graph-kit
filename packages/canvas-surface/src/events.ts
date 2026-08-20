import { EventMapToEventRegistry } from '@core/events/types';

export type CanvasLifecycleEvents = {
  onMounted: () => void;
  onBeforeUnmount: () => void;
  /**
   * triggered at the top and bottom of a repaint, bracketing everything the
   * frame does: the clear, the background pattern and the content draw.
   */
  onBeforeRepaint: () => void;
  onAfterRepaint: () => void;
};

type CanvasSurfaceLifecycleEventRegistry =
  EventMapToEventRegistry<CanvasLifecycleEvents>;

export const createCanvasLifecycleEventRegistry =
  (): CanvasSurfaceLifecycleEventRegistry => ({
    onMounted: new Set(),
    onBeforeUnmount: new Set(),
    onBeforeRepaint: new Set(),
    onAfterRepaint: new Set(),
  });
