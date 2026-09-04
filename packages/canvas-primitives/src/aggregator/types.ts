import { Shape } from '../types/index.ts';

/**
 * the array in which canvas elements are added into in order to be rendered on the canvas
 */
export type Aggregator = CanvasElement[];

/**
 * a function that takes an `aggregator` and returns an `aggregator` with alterations to
 * the internal contents, these functions are layered on top of each other to create a pipeline
 * which will be invoked with a reducer each render cycle
 */
export type AggregatorTransformer = (aggregator: Aggregator) => Aggregator;

/**
 * an element that can be fed into the `aggregator` in order to be rendered on the canvas
 */
export type CanvasElement = {
  /**
   * unique identifier for this element
   */
  id: string;
  /**
   * determines the rendering order on the canvas.
   *
   * ℹ️ elements with lower priority values are rendered earlier and appear
   * visually beneath items with higher values.
   */
  priority: number;
  /**
   * the {@link Shape | shape} to be rendered on the canvas
   */
  shape: Shape;
  /**
   * marks this element as paint only. it renders like any other, but
   * `getCanvasElementsAtCoordinate` never returns it, so the pointer lands on whatever
   * sits beneath it instead.
   */
  paintOnly?: boolean;
  /**
   * attached metadata. a handful of keys are reserved by the code that reads them, each declared
   * as a constant alongside it: `CANVAS_ELEMENT_CURSOR_FIELD_KEY` in `@canvas/surface/cursor`
   */
  data?: Record<string, unknown>;
};
