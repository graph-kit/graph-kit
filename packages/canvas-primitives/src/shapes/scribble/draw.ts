import { circle } from '../../shapes/circle/index.ts';
import type { ScribbleSchemaWithDefaults } from './defaults.ts';
import { ERASER_BRUSH_WEIGHT } from './index.ts';

export const drawScribbleWithCtx =
  (schema: ScribbleSchemaWithDefaults) => (ctx: CanvasRenderingContext2D) => {
    const { type, fillColor: color, brushWeight, points } = schema;

    const draw = () => {
      // a scribble is nothing but its stroke, so with no paint there is nothing to draw
      if (!color) return;

      if (points.length === 1) {
        circle({
          at: points[0],
          radius: brushWeight / 2,
          fillColor: color,
        }).draw(ctx);
        return;
      }
      ctx.strokeStyle = color;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = brushWeight;
      ctx.beginPath();
      const [first, ...rest] = points;
      ctx.moveTo(first.x, first.y);
      rest.forEach(({ x, y }) => ctx.lineTo(x, y));
      ctx.stroke();
    };

    const erase = () => {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = ERASER_BRUSH_WEIGHT;

      for (let i = 0; i < points.length - 1; i++) {
        const start = points[i];
        const end = points[i + 1];
        const squaredDistance =
          Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2);
        const distance = Math.sqrt(squaredDistance);
        const steps = Math.ceil(distance / ERASER_BRUSH_WEIGHT);

        for (let j = 0; j <= steps; j++) {
          const interpolatedX = start.x + (j / steps) * (end.x - start.x);
          const interpolatedY = start.y + (j / steps) * (end.y - start.y);

          ctx.beginPath();
          ctx.arc(
            interpolatedX,
            interpolatedY,
            ERASER_BRUSH_WEIGHT,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
      }

      ctx.globalCompositeOperation = 'source-over';
    };

    (type === 'draw' ? draw : erase)();

    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';
  };
