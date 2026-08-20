import type { CanvasElement } from '@canvas/primitives/aggregator/types';
import type {
  ElementMouseEvent as CanvasGraphMouseEvent,
  ElementsUnderCursor,
} from '@canvas/surface/events/index';
import { EventMapToEventRegistry } from '@core/events/types';
import { DeepReadonly } from 'ts-essentials';

/**
 * a standard mouse event along with extra graph related info
 * regarding the mouse position
 */
export type { CanvasGraphMouseEvent };

export type CanvasEventMap = {
  /**
   * after the canvas is repainted
   *
   * **WARNING** items drawn to the canvas using ctx won't be tied to graphs internal state.
   * see {@link graph.canvas.aggregator | `aggregator`} if you need drawn item to integrate with graph APIs
   */
  onDraw: (ctx: CanvasRenderingContext2D) => void;

  /**
   * right after the canvas is cleared and right before it is repainted
   *
   * **WARNING** items drawn to the canvas using ctx won't be tied to graphs internal state.
   * see {@link graph.canvas.aggregator | `aggregator`} if you need drawn item to integrate with graph APIs
   */
  onBeforeDraw: (ctx: CanvasRenderingContext2D) => void;

  onGraphUnderCursorChange: (data: DeepReadonly<ElementsUnderCursor>) => void;
  onHoveredElementChange: (
    newElement: DeepReadonly<CanvasElement> | undefined,
    oldElement: DeepReadonly<CanvasElement> | undefined,
  ) => void;
};

type CanvasEventRegistry = EventMapToEventRegistry<CanvasEventMap>;

export const createCanvasEventRegistry = (): CanvasEventRegistry => ({
  onBeforeDraw: new Set(),
  onDraw: new Set(),

  onGraphUnderCursorChange: new Set(),
  onHoveredElementChange: new Set(),
});
