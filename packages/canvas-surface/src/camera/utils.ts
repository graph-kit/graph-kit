import { getDevicePixelRatio } from '@core/utils/canvas/index';

import { onMounted, ref } from 'vue';

export type TransformProps = {
  /** corresponds to `a` in {@link CanvasRenderingContext2D.setTransform} */
  scaleX: number;
  /** corresponds to `b` in {@link CanvasRenderingContext2D.setTransform} */
  skewY: number;
  /** corresponds to `c` in {@link CanvasRenderingContext2D.setTransform} */
  skewX: number;
  /** corresponds to `d` in {@link CanvasRenderingContext2D.setTransform} */
  scaleY: number;
  /** corresponds to `e` in {@link CanvasRenderingContext2D.setTransform} */
  translateX: number;
  /** corresponds to `f` in {@link CanvasRenderingContext2D.setTransform} */
  translateY: number;
};

export type TransformOptions = Partial<TransformProps>;

export const useDevicePixelRatio = () => {
  const dpr = ref(1);
  onMounted(() => (dpr.value = getDevicePixelRatio()));
  return dpr;
};

export const addTransform = (
  ctx: CanvasRenderingContext2D,
  t: TransformOptions,
) => {
  const translateX = t.translateX ?? 0;
  const translateY = t.translateY ?? 0;
  if (translateX !== 0 || translateY !== 0) {
    ctx.translate(translateX, translateY);
  }

  const scaleX = t.scaleX ?? 1;
  const scaleY = t.scaleY ?? 1;
  if (scaleX !== 1 || scaleY !== 1) {
    ctx.scale(scaleX, scaleY);
  }

  const skewX = t.skewX ?? 0;
  const skewY = t.skewY ?? 0;
  if (skewX !== 0 || skewY !== 0) {
    ctx.transform(1, skewY, skewX, 1, 0, 0);
  }
};
