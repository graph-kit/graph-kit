import type { AggregatorControls } from '@canvas/primitives/aggregator/index';
import { CURSOR, Cursor, isValidCursor } from '@core/utils/cursor';

import type { Ref } from 'vue';

import type { ElementsUnderCursor } from './events/index.ts';

/**
 * the key a canvas element hangs its cursor from. anything contributing to the
 * aggregator can set it, and the topmost element under the pointer wins
 */
export const CANVAS_ELEMENT_CURSOR_FIELD_KEY = 'cursor';

type CursorProps = {
  subscribe: AggregatorControls['events']['subscribe'];
  canvas: Ref<HTMLCanvasElement | undefined>;
  elementsUnderCursor: Pick<ElementsUnderCursor, 'topElement'>;
  /**
   * a cursor for the whole canvas, overriding whatever is under the pointer.
   * `undefined` defers to the element, which is the usual answer
   */
  canvasCursor?: () => Cursor | undefined;
};

/**
 * shapes the canvas cursor to whatever is drawn beneath it, resolved against
 * the aggregator as it was painted rather than against the data behind it
 */
export const setupCursor = ({
  subscribe,
  canvas,
  elementsUnderCursor,
  canvasCursor,
}: CursorProps) => {
  const getCursor = (): Cursor => {
    const wholeCanvas = canvasCursor?.();
    if (wholeCanvas !== undefined) return wholeCanvas;

    const topElement = elementsUnderCursor.topElement;
    if (!topElement) return CURSOR.DEFAULT;

    const elementCursor = topElement.data?.[CANVAS_ELEMENT_CURSOR_FIELD_KEY];

    if (elementCursor === undefined) return CURSOR.DEFAULT;
    if (!isValidCursor(elementCursor)) {
      console.warn(`expected valid cursor: got "${elementCursor}"`);
      return CURSOR.DEFAULT;
    }

    return elementCursor;
  };

  const refreshCursor = () => {
    if (!canvas.value) return;
    const currentCursor = canvas.value.style.cursor;
    const newCursor = getCursor();
    if (currentCursor !== newCursor) canvas.value.style.cursor = newCursor;
  };

  subscribe('onDraw', refreshCursor);
};
