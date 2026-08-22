import { Shape } from '../types/index.ts';

/**
 * a step in the pipeline that decides what the canvas paints this frame. every registered
 * transformer runs once per frame, in registration order, each handed the array the
 * previous one returned, starting from an empty one.
 *
 * ℹ️ the array is yours to mutate for the length of the call, so pushing onto it and
 * returning it is the normal shape. returning a fresh array works too, which is how a
 * transformer culls
 *
 * ⚠️ a transformer runs on the hot path, once per frame per registration. it should read
 * state and build elements, not compute anything it could have cached
 *
 * @param elements what the transformers before it left behind
 * @returns what the transformers after it will be handed
 * @example const withOverlay: AggregatorTransformer = (elements) => {
 *   elements.push(overlayElement)
 *   return elements
 * }
 */
export type AggregatorTransformer = (
  elements: CanvasElement[],
) => CanvasElement[];

/**
 * a shape the canvas paints, plus what the rest of the system needs to reason about it:
 * who it is, what it sits above, and whether the pointer can land on it
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
   * marks this element as paint only. it renders like any other, but `elementsAt` never
   * returns it, so the pointer lands on whatever sits beneath it instead.
   */
  paintOnly?: boolean;
  /**
   * attached metadata, for the element to say something the shape cannot. read by whoever
   * declared the key, so a key nobody claims is inert rather than wrong.
   *
   * ℹ️ every reserved key is declared as a constant next to the code that reads it:
   * `CANVAS_ELEMENT_CURSOR_FIELD_KEY` in `setupCursor`, `NODE_DRAG_CANVAS_ELEMENT_DATA_FIELD`
   * in the `node-drag` plugin
   */
  data?: Record<string, unknown>;
};
