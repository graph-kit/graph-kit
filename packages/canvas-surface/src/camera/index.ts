import type { ReadonlyEventHub } from '@core/events/createEventHub';

import type { Ref } from 'vue';

import type {
  CanvasBoundEvents,
  DocumentBoundEvents,
} from '../events/index.ts';
import { usePanAndZoom } from './panZoom.ts';
import { addTransform, useDevicePixelRatio } from './utils.ts';

export const useCamera = (
  canvas: Ref<HTMLCanvasElement | undefined>,
  canvasEvents: Pick<ReadonlyEventHub<CanvasBoundEvents>, 'subscribe'>,
  domEvents: Pick<ReadonlyEventHub<DocumentBoundEvents>, 'subscribe'>,
) => {
  const { getTransform: getPanZoomTransform, ...rest } = usePanAndZoom(
    canvas,
    canvasEvents,
    domEvents,
  );
  const dpr = useDevicePixelRatio();

  return {
    ...rest,
    transformAndClear: (ctx: CanvasRenderingContext2D) => {
      ctx.resetTransform();
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      const transforms = [
        {
          scaleX: dpr.value,
          scaleY: dpr.value,
        },
        getPanZoomTransform(),
      ];
      for (const t of transforms) addTransform(ctx, t);
    },
  };
};

export type Camera = ReturnType<typeof useCamera>;
