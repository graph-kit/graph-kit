import { getCtx, getWorldCoordinates } from '@core/utils/canvas/index';
import type { ReadonlyEventHub } from '@graph/primitives/events/createEventHub';

import { type Ref, ref } from 'vue';

import type { CanvasDOMEvents } from '../domEvents.ts';
import { Coordinate } from '../types.ts';

/**
 * tracks the cursor position in world coordinates, meaning the camera's pan and
 * zoom have already been undone.
 */
export const useWorldCoordinates = (
  canvas: Ref<HTMLCanvasElement | undefined>,
  domEvents: ReadonlyEventHub<CanvasDOMEvents>,
) => {
  const worldCoordinates = ref<Coordinate>({ x: 0, y: 0 });

  const captureWorldCoords = (ev: MouseEvent) =>
    (worldCoordinates.value = getWorldCoordinates(ev, getCtx(canvas)));

  domEvents.subscribe('onMouseMove', captureWorldCoords);
  // zooming moves the world under a stationary cursor, so the point changes without a mousemove
  domEvents.subscribe('onWheel', captureWorldCoords);

  return { worldCoordinates };
};
