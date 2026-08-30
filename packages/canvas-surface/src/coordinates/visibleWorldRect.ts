import type { BoundingBox } from '@core/utils/canvas/index';

import { type Ref, computed } from 'vue';

import type { Camera } from '../camera/index.ts';

type CanvasSize = {
  width: Readonly<Ref<number>>;
  height: Readonly<Ref<number>>;
};

/**
 * the slice of the world the canvas currently shows.
 */
export const useVisibleWorldRect = (
  { panX, panY, zoom }: Camera['state'],
  canvasSize: CanvasSize,
) =>
  computed<BoundingBox>(() => ({
    at: {
      x: -panX.value / zoom.value,
      y: -panY.value / zoom.value,
    },
    width: canvasSize.width.value / zoom.value,
    height: canvasSize.height.value / zoom.value,
  }));
