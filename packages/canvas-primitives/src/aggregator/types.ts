import type { Cursor } from '@core/utils/cursor';

import { Shape } from '../types/index.ts';

/**
 * usually pushes onto the array and returns it. return a new array to remove elements.
 * runs every frame, so keep it cheap
 */
export type AggregatorTransformer = (
  elements: CanvasElement[],
) => CanvasElement[];

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
   * marks this element as paint only. it renders like any other, but `elementsAt` never
   * returns it, so the pointer lands on whatever sits beneath it instead.
   */
  paintOnly?: boolean;
  /**
   * the browser cursor associated with this canvas element
   */
  cursor?: Cursor;
  /**
   * the key `'dragNodeIds'` is reserved by the node-drag plugin
   * (`NODE_DRAG_CANVAS_ELEMENT_DATA_FIELD`)
   */
  data?: Record<string, unknown>;
};
