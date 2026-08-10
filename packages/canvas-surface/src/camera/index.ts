import type { ReadonlyEventHub } from '@graph/primitives/events/createEventHub';

import type { Ref } from 'vue';

import type { CanvasDOMEvents } from '../domEvents.ts';
import { usePanAndZoom } from './panZoom.ts';
import { addTransform, useDevicePixelRatio } from './utils.ts';

export const useCamera = (
  canvas: Ref<HTMLCanvasElement | undefined>,
  domEvents: ReadonlyEventHub<CanvasDOMEvents>,
) => {
  const { getTransform: getPanZoomTransform, ...rest } = usePanAndZoom(
    canvas,
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
