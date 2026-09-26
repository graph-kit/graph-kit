import type { EventMapToEventRegistry } from '@core/events/types';

export type AggregatorEventMap = {
  /** fires before the element list is rebuilt, so transformers can read fresh data */
  onBeforeDraw: (ctx: CanvasRenderingContext2D) => void;
  /** fires after every element has been drawn */
  onDraw: (ctx: CanvasRenderingContext2D) => void;
};

type AggregatorEventRegistry = EventMapToEventRegistry<AggregatorEventMap>;

export const createAggregatorEventRegistry = (): AggregatorEventRegistry => ({
  onBeforeDraw: new Set(),
  onDraw: new Set(),
});
