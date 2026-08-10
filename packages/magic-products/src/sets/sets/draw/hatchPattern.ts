import { nullThrows } from '@core/utils/assert';

const patternCache = new Map<string, CanvasPattern>();

const parseHex = (color: string): [number, number, number] => {
  const n = parseInt(color.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export const hatchPattern = (
  ctx: CanvasRenderingContext2D,
  colors: string[],
  stripeWidth = 8,
): CanvasPattern => {
  const key = colors.join('|');
  const cached = patternCache.get(key);
  if (cached) return cached;

  const tileSize = stripeWidth * colors.length;
  const offscreen = new OffscreenCanvas(tileSize, tileSize);
  const offscreenCtx = nullThrows(
    offscreen.getContext('2d'),
    'could not get 2d context off of canvas',
  );
  const imgData = offscreenCtx.createImageData(tileSize, tileSize);
  const parsed = colors.map(parseHex);

  for (let y = 0; y < tileSize; y++) {
    for (let x = 0; x < tileSize; x++) {
      const stripeIdx = Math.floor(((x + y) % tileSize) / stripeWidth);
      const [r, g, b] = parsed[stripeIdx];
      const i = (y * tileSize + x) * 4;
      imgData.data[i] = r;
      imgData.data[i + 1] = g;
      imgData.data[i + 2] = b;
      imgData.data[i + 3] = 255;
    }
  }

  offscreenCtx.putImageData(imgData, 0, 0);
  const pattern = ctx.createPattern(offscreen, 'repeat')!;
  patternCache.set(key, pattern);
  return pattern;
};
