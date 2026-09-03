import { calculateArrowHeadCorners } from '../../helpers.ts';
import { drawLineWithCtx } from '../line/draw.ts';
import { triangle } from '../triangle/index.ts';
import type { ArrowSchemaWithDefaults } from './defaults.ts';

/** covers antialiasing that happens when triangle and line get painted */
const SEAM_OVERLAP_DEVICE_PX = 1;

const getDevicePixelSize = (ctx: CanvasRenderingContext2D) => {
  const { a, b } = ctx.getTransform();
  const scale = Math.hypot(a, b);
  return scale > 0 ? 1 / scale : 0;
};

export const drawArrowWithCtx = (schema: ArrowSchemaWithDefaults) => {
  const { start, end, lineWidth, fillGradient, fillColor } = schema;

  const headSchema = calculateArrowHeadCorners({
    start,
    end,
    lineWidth,
  });

  const { pointB, pointC } = headSchema;

  const baseMidpoint = {
    x: (pointB.x + pointC.x) / 2,
    y: (pointB.y + pointC.y) / 2,
  };

  const length = Math.hypot(end.x - start.x, end.y - start.y);
  const unit = {
    x: length > 0 ? (end.x - start.x) / length : 0,
    y: length > 0 ? (end.y - start.y) / length : 0,
  };

  const head = triangle({
    ...headSchema,
    fillColor:
      fillGradient && fillGradient.length
        ? fillGradient.at(-1)?.color
        : fillColor,
  });

  return (ctx: CanvasRenderingContext2D) => {
    const overlap = SEAM_OVERLAP_DEVICE_PX * getDevicePixelSize(ctx);

    const drawShaft = drawLineWithCtx({
      ...schema,
      end: {
        x: baseMidpoint.x + unit.x * overlap,
        y: baseMidpoint.y + unit.y * overlap,
      },
    });

    drawShaft(ctx);
    head.drawShape(ctx);
  };
};
