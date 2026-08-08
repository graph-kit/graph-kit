import { getCtx, getWorldCoordinates } from '@core/utils/canvas/index';

import { type Ref, onMounted, ref } from 'vue';

import { Coordinate } from '../types.ts';

/**
 * tracks the cursor position in world coordinates, meaning the camera's pan and
 * zoom have already been undone.
 */
export const useWorldCoordinates = (
  canvas: Ref<HTMLCanvasElement | undefined>,
) => {
  const worldCoordinates = ref<Coordinate>({ x: 0, y: 0 });

  const captureWorldCoords = (ev: MouseEvent) =>
    (worldCoordinates.value = getWorldCoordinates(ev, getCtx(canvas)));

  onMounted(() => {
    if (!canvas.value)
      throw new Error('Canvas not found in DOM. Check ref link.');
    canvas.value.addEventListener('mousemove', captureWorldCoords);
    // zooming moves the world under a stationary cursor, so the point changes without a mousemove
    canvas.value.addEventListener('wheel', captureWorldCoords);
  });

  return {
    worldCoordinates,
    cleanup: (ref: HTMLCanvasElement) => {
      ref.removeEventListener('mousemove', captureWorldCoords);
      ref.removeEventListener('wheel', captureWorldCoords);
    },
  };
};
