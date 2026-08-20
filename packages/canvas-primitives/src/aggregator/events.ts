import type { EventMapToEventRegistry } from '@core/events/types';

export type AggregatorEventMap = {
  /**
   * before the aggregator is rebuilt for this frame, so a producer can refresh whatever
   * its transformer is about to read
   */
  onBeforeDraw: (ctx: CanvasRenderingContext2D) => void;
  /** once every element in the aggregator has been painted */
  onDraw: (ctx: CanvasRenderingContext2D) => void;
};

type AggregatorEventRegistry = EventMapToEventRegistry<AggregatorEventMap>;

export const createAggregatorEventRegistry = (): AggregatorEventRegistry => ({
  onBeforeDraw: new Set(),
  onDraw: new Set(),
});
