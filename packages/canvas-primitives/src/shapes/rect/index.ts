import { getCenterPoint } from '../../helpers.ts';
import { validateBorderRadius } from '../../optionsValidator.ts';
import { shapeFactoryWrapper } from '../../shapeWrapper.ts';
import { getShapeTextProps } from '../../text/text.ts';
import type { ShapeFactory } from '../../types/index.ts';
import type { Coordinate } from '../../types/utility.ts';
import { resolveRectDefaults } from './defaults.ts';
import { drawRectWithCtx } from './draw.ts';
import { getRectBoundingBox, rectHitbox, rectOverlapsBox } from './hitbox.ts';
import { getRectPath } from './path.ts';
import type { RectSchema } from './types.ts';

export const rect: ShapeFactory<RectSchema> = (options) => {
  validateBorderRadius(options);

  const schema = resolveRectDefaults(options);
  const drawShape = drawRectWithCtx(schema);
  const text = getShapeTextProps(
    getCenterPoint(schema),
    schema.textArea,
    drawShape,
  );
  const { drawOverride, ...textProps } = text ?? {};

  const shapeHitbox = rectHitbox(schema);
  const overlapsBox = rectOverlapsBox(schema);
  const hitbox = (point: Coordinate) =>
    text?.textHitbox(point) || shapeHitbox(point);

  const getBoundingBox = getRectBoundingBox(schema);

  const draw =
    drawOverride ??
    ((ctx: CanvasRenderingContext2D) => {
      drawShape(ctx);
      text?.drawTextArea(ctx);
    });

  return shapeFactoryWrapper({
    name: 'rect',

    draw,
    drawShape,

    hitbox,
    shapeHitbox,
    overlapsBox,

    getBoundingBox,

    path: getRectPath(schema),

    ...textProps,
  });
};
