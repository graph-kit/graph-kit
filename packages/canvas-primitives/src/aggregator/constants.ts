import type { CanvasElement } from './types.ts';

/**
 * key on {@link CanvasElement.data} marking an element as paint only. it renders like any
 * other, but `getCanvasElementsAtCoordinate` never returns it, so the pointer lands on
 * whatever sits beneath it instead.
 *
 * @example data: { [CANVAS_ELEMENT_PAINT_ONLY_FIELD_KEY]: true }
 */
export const CANVAS_ELEMENT_PAINT_ONLY_FIELD_KEY = 'paintOnly';
