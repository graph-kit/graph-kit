import { nullThrows } from '@core/utils/assert';

import { CANVAS_MISSING } from './constants.ts';

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
export const syncBackingStore = (
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
