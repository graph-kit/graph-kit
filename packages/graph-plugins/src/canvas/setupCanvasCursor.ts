import { CanvasSurface } from '@canvas/surface/types';
import { EventHub } from '@core/events/createEventHub';
import { CURSOR_FALLBACK } from '@core/themes/index';
import { CURSOR, Cursor, isValidCursor } from '@core/utils/cursor';
import { CoreGetters } from '@graph/core/getters';
import { GraphGetters } from '@graph/primitives/getters/types';

import { CanvasEventMap } from './events.ts';
import { CanvasControls } from './types.ts';

type GraphCursorProps = {
  subscribe: EventHub<CanvasEventMap>['subscribe'];
  canvas: CanvasSurface['canvas'];
  getNode: GraphGetters<CoreGetters>['getNode'];
  resolveToken: CanvasControls['theme']['_resolveToken'];
  graphUnderCursor: CanvasControls['graphUnderCursor'];
};

export const CANVAS_ELEMENT_CURSOR_FIELD_KEY = 'cursor';

/**
 * manages the cursor type when hovering over the graph
 */
export const setupCanvasCursor = ({
  subscribe,
  canvas,
  resolveToken,
  graphUnderCursor,
}: GraphCursorProps) => {
  const getCursor = (): Cursor => {
    const canvasTheme = resolveToken('canvas.cursor');
    if (canvasTheme !== CURSOR_FALLBACK) return canvasTheme;

    const topElement = graphUnderCursor.topElement;
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
