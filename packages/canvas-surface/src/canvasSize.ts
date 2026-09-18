import { nullThrows } from '@core/utils/assert';

import {
  type Ref,
  onBeforeUnmount,
  onMounted,
  readonly,
  ref,
  watch,
} from 'vue';

import { CANVAS_MISSING } from './constants.ts';

export type CanvasSize = {
  width: Readonly<Ref<number>>;
  height: Readonly<Ref<number>>;
};

type SyncBackingStoreResult = {
  /** the canvas's layout box in css pixels */
  rect: DOMRect;
  /** whether the backing store dimensions changed */
  resized: boolean;
};

/**
 * matches the canvas's pixel buffer to its layout box scaled by
 * `devicePixelRatio`
 */
const syncBackingStore = (
  canvasRef: HTMLCanvasElement | undefined,
  devicePixelRatio: number,
): SyncBackingStoreResult => {
  const canvas = nullThrows(canvasRef, CANVAS_MISSING);

  const rect = canvas.getBoundingClientRect();
  const width = Math.round(rect.width * devicePixelRatio);
  const height = Math.round(rect.height * devicePixelRatio);

  const resized = canvas.width !== width || canvas.height !== height;
  if (resized) {
    canvas.width = width;
    canvas.height = height;
  }

  return { rect, resized };
};

type CanvasSizeOptions = {
  canvas: Ref<HTMLCanvasElement | undefined>;
  devicePixelRatio: Readonly<Ref<number>>;
  /** runs whenever the backing store changes size */
  onResize: () => void;
};

/**
 * the canvas's layout box in css pixels, kept in sync with the element and its
 * backing store
 */
export const useCanvasSize = ({
  canvas,
  devicePixelRatio,
  onResize,
}: CanvasSizeOptions): CanvasSize => {
  const width = ref(0);
  const height = ref(0);

  let resizeObserver: ResizeObserver | undefined;

  const sync = () => {
    const { rect, resized } = syncBackingStore(
      canvas.value,
      devicePixelRatio.value,
    );
    width.value = rect.width;
    height.value = rect.height;
    return resized;
  };

  const syncAndNotify = () => {
    if (sync()) onResize();
  };

  // tracks when user drags window to another display
  watch(devicePixelRatio, syncAndNotify);

  onMounted(() => {
    sync();
    resizeObserver = new ResizeObserver(syncAndNotify);
    resizeObserver.observe(nullThrows(canvas.value, CANVAS_MISSING));
  });

  onBeforeUnmount(() => {
    nullThrows(resizeObserver, 'resize observer undefined').disconnect();
    resizeObserver = undefined;
  });

  return { width: readonly(width), height: readonly(height) };
};
