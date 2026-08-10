import type { MaybeRef } from 'vue';

/**
 * a point in the canvas world
 */
export type Coordinate = {
  x: number;
  y: number;
};

/**
 * the coordinates in the real world. aka the browser
 */
export type ClientCoords = Pick<MouseEvent, 'clientX' | 'clientY'>;

/**
 * the coordinates in the canvas world
 */
export type Coords = Coordinate;

/**
 * a rectangle in the canvas world, most often the slice of it the canvas
 * currently shows. see `visibleWorldRect` on the canvas surface
 */
export type WorldRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type WithZoom<T> = T & {
  /**
   * the scale factor of the canvas
   */
  zoom: number;
};

/**
 * gets `ctx` from a `<canvas />` or canvas ref (vue.js)
 *
 * @returns {CanvasRenderingContext2D}
 * @example const ctx = getCtx(canvasRef);
 * // ctx is defined and ready to use
 * @throws {Error} if canvas element isn't in the DOM or `canvas.getContext` returns `null`
 */
export const getCtx = (
  canvasInput: MaybeRef<HTMLCanvasElement | null | undefined>,
) => {
  if (!canvasInput) throw new Error('canvas not found');
  const canvas = 'value' in canvasInput ? canvasInput.value : canvasInput;
  if (!canvas) throw new Error('canvas not found');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2d context not found');
  return ctx;
};

export const getDevicePixelRatio = () => window.devicePixelRatio ?? 1;

export const getCanvasTransform = (ctx: CanvasRenderingContext2D) => {
  const { a, e, f } = ctx.getTransform();
  // TODO investigate why dpr isn't already factored into ctx. Camera should add it with the PZ transform!
  const dpr = getDevicePixelRatio();
  const zoom = a / dpr;
  const panX = e / dpr;
  const panY = f / dpr;
  return { panX, panY, zoom };
};

/**
 * converts client coordinates into world coordinates by undoing the camera's pan and zoom.
 *
 * @example
 * // camera panned 10px left, not zoomed
 * getWorldCoordinates({ clientX: 0, clientY: 0 }, ctx);
 * // { x: -10, y: 0, zoom: 1 }
 */
export const getWorldCoordinates = (
  clientCoords: ClientCoords,
  ctx: CanvasRenderingContext2D,
): WithZoom<Coords> => {
  // measuring forces layout, so this is for one off callers like event handlers
  const rect = ctx.canvas.getBoundingClientRect();
  const localX = clientCoords.clientX - rect.left;
  const localY = clientCoords.clientY - rect.top;

  const { panX, panY, zoom } = getCanvasTransform(ctx);

  const x = (localX - panX) / zoom;
  const y = (localY - panY) / zoom;

  return { x, y, zoom };
};

/**
 * client coordinates are the raw coordinates corresponding to the clients physical screen.
 *
 * the top left corner is (0, 0) and bottom right corner is (window.innerWidth, window.innerHeight).
 */
export const getClientCoordinates = (
  worldCoords: Coords,
  ctx: CanvasRenderingContext2D,
): WithZoom<ClientCoords> => {
  const { panX, panY, zoom } = getCanvasTransform(ctx);
  const { x, y } = worldCoords;

  return {
    clientX: x * zoom + panX,
    clientY: y * zoom + panY,
    zoom,
  };
};
