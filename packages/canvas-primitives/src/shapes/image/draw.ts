import { rect } from '../rect/index.ts';
import { resolveImage } from './cache.ts';
import type { ImageSchemaWithDefaults } from './defaults.ts';

/**
 * checkerboard as placeholder for image that fails to load
 *
 * https://commons.wikimedia.org/wiki/File:Missing_texture_checkerboard_pattern.svg
 */
const drawMissingMediaCheckerboard = (
  width: number,
  height: number,
  ctx: CanvasRenderingContext2D,
) => {
  const squareSize = 10;
  const startX = -width / 2;
  const startY = -height / 2;
  for (let y = 0; y < Math.ceil(height / squareSize); y++) {
    for (let x = 0; x < Math.ceil(width / squareSize); x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? '#FF00DC' : '#000000';
      ctx.fillRect(
        startX + x * squareSize,
        startY + y * squareSize,
        squareSize,
        squareSize,
      );
    }
  }
};

export const drawImageWithCtx = (schema: ImageSchemaWithDefaults) => {
  const { src, onLoad, onLoadError, ...rectProps } = schema;

  const { width, height, at, rotation } = rectProps;

  return (ctx: CanvasRenderingContext2D) => {
    const { image, error } = resolveImage(src, {
      onLoad,
      onLoadError,
    });

    rect(rectProps).drawShape(ctx);

    // the canvas repaints on its own loop, so a load still in flight simply lands on a
    // later frame rather than holding this one open
    if (!image && !error) return;

    ctx.save();

    const centerX = at.x + width / 2;
    const centerY = at.y + height / 2;

    ctx.translate(centerX, centerY);

    if (rotation) {
      ctx.rotate(rotation);
    }

    if (error) {
      drawMissingMediaCheckerboard(width, height, ctx);
    }

    if (image) {
      ctx.drawImage(image, -width / 2, -height / 2, width, height);
    }

    ctx.restore();
  };
};
