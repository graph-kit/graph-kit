import type { ReadonlyEventHub } from '@core/events/createEventHub';

import { ref } from 'vue';

import type { Camera } from '../camera/index.ts';
import type { CanvasBoundEvents } from '../events/index.ts';
import { Coordinate } from '../types.ts';

/**
 * tracks the cursor position in world coordinates, meaning the camera's pan and
 * zoom have already been undone.
 */
export const useWorldCoordinates = (
  { panX, panY, zoom }: Camera['state'],
  domEvents: ReadonlyEventHub<CanvasBoundEvents>,
) => {
  // offset is already relative to the canvas the listener sits on, so nothing is measured
  const toWorldCoordinates = (ev: MouseEvent): Coordinate => ({
    x: (ev.offsetX - panX.value) / zoom.value,
    y: (ev.offsetY - panY.value) / zoom.value,
  });

  const worldCoordinates = ref<Coordinate>({ x: 0, y: 0 });

  const captureWorldCoords = (ev: MouseEvent) =>
    (worldCoordinates.value = toWorldCoordinates(ev));

  domEvents.subscribe('onMouseMove', captureWorldCoords);
  // zooming moves the world under a stationary cursor, so the point changes without a mousemove
  domEvents.subscribe('onWheel', captureWorldCoords);

  return { worldCoordinates, toWorldCoordinates };
};
