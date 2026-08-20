import type { AggregatorControls } from '@canvas/primitives/aggregator/index';
import { CanvasSurface } from '@canvas/surface/types';
import { CURSOR_FALLBACK } from '@core/themes/index';
import { CURSOR, Cursor, isValidCursor } from '@core/utils/cursor';
import { CoreGetters } from '@graph/core/getters';
import { GraphGetters } from '@graph/primitives/getters/types';

import { SurfaceControls } from './types.ts';

type CursorProps = {
  subscribe: AggregatorControls['events']['subscribe'];
  canvas: CanvasSurface['canvas'];
  getNode: GraphGetters<CoreGetters>['getNode'];
  resolveToken: SurfaceControls['theme']['_resolveToken'];
  elementsUnderCursor: CanvasSurface['elementsUnderCursor'];
};

export const CANVAS_ELEMENT_CURSOR_FIELD_KEY = 'cursor';

/**
 * manages the cursor type when hovering over the graph
 */
export const setupCursor = ({
  subscribe,
  canvas,
  resolveToken,
  elementsUnderCursor,
}: CursorProps) => {
  const getCursor = (): Cursor => {
    const canvasTheme = resolveToken('canvas.cursor');
    if (canvasTheme !== CURSOR_FALLBACK) return canvasTheme;

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
