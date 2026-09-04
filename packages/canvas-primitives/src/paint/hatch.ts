import { nullThrows } from '@core/utils/assert';
import tinycolor from 'tinycolor2';

const DEFAULT_STRIPE_WIDTH = 8;

/*
  a pattern belongs to the context that created it, so the cache is keyed by
  context first. the weak map lets a context that goes away take its patterns
  with it, which matters for the pooled scratch canvases
*/
const patternsByCtx = new WeakMap<
  CanvasRenderingContext2D,
  Map<string, CanvasPattern>
>();

const createTile = (colors: readonly string[], stripeWidth: number) => {
  const tileSize = stripeWidth * colors.length;

  const canvas = document.createElement('canvas');
  canvas.width = tileSize;
  canvas.height = tileSize;

  const tileCtx = nullThrows(
    canvas.getContext('2d'),
    '2d context not found on hatch tile canvas',
  );

  const imgData = tileCtx.createImageData(tileSize, tileSize);
  const parsed = colors.map((color) => tinycolor(color).toRgb());

  for (let y = 0; y < tileSize; y++) {
    for (let x = 0; x < tileSize; x++) {
      const stripe = Math.floor(((x + y) % tileSize) / stripeWidth);
      const { r, g, b } = parsed[stripe];
      const i = (y * tileSize + x) * 4;
      imgData.data[i] = r;
      imgData.data[i + 1] = g;
      imgData.data[i + 2] = b;
      imgData.data[i + 3] = 255;
    }
  }

  tileCtx.putImageData(imgData, 0, 0);
  return canvas;
};

/**
 * a repeating diagonal stripe of `colors`, as a paint for `ctx`
 *
 * ℹ️ patterns lay out in user space, so a stripe is `stripeWidth` world pixels
 * and coarsens as the camera zooms out. pair it with `imageSmoothingEnabled =
 * false`, or the stripes blur into their own average at low zoom
 *
 * @example ctx.fillStyle = hatchPattern(ctx, ['#f00', '#00f'])
 */
export const hatchPattern = (
  ctx: CanvasRenderingContext2D,
  colors: readonly string[],
  stripeWidth = DEFAULT_STRIPE_WIDTH,
): CanvasPattern => {
  const cache = patternsByCtx.get(ctx) ?? new Map<string, CanvasPattern>();
  patternsByCtx.set(ctx, cache);

  const key = `${stripeWidth}|${colors.join(',')}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const pattern = nullThrows(
    ctx.createPattern(createTile(colors, stripeWidth), 'repeat'),
    'could not create a hatch pattern',
  );

  cache.set(key, pattern);
  return pattern;
};
