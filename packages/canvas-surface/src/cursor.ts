import type { AggregatorControls } from '@canvas/primitives/aggregator/index';
import type { CanvasElement } from '@canvas/primitives/aggregator/types';
import { CURSOR, Cursor } from '@core/utils/cursor';

import type { Ref } from 'vue';

import type { ElementsUnderCursor } from './events/index.ts';

type CursorProps = {
  subscribe: AggregatorControls['events']['subscribe'];
  canvas: Ref<HTMLCanvasElement | undefined>;
  elementsUnderCursor: Pick<ElementsUnderCursor, 'topElement'>;
  /**
   * when this returns a cursor, the browser shows it anywhere on the canvas.
   * returning `undefined` falls back to the {@link CanvasElement.cursor} of
   * the canvas element under the pointer
   */
  cursorOverride?: () => Cursor | undefined;
};

/**
 * shapes the canvas cursor to whatever is drawn beneath it, resolved against
 * the aggregator as it was painted rather than against the data behind it
 */
export const setupCursor = ({
  subscribe,
  canvas,
  elementsUnderCursor,
  cursorOverride,
}: CursorProps) => {
  const getCursor = (): Cursor => {
    const override = cursorOverride?.();
    if (override !== undefined) return override;

    return elementsUnderCursor.topElement?.cursor ?? CURSOR.DEFAULT;
  };

  const refreshCursor = () => {
    if (!canvas.value) return;
    const currentCursor = canvas.value.style.cursor;
    const newCursor = getCursor();
    if (currentCursor !== newCursor) canvas.value.style.cursor = newCursor;
  };

  subscribe('onDraw', refreshCursor);
};
