import type { EllipseSchemaWithDefaults } from './defaults.ts';

/*
  the fill outline, so the stroke is deliberately absent: a path is what the
  shape encloses, while the stroke straddles that boundary
*/
export const getEllipsePath = (schema: EllipseSchemaWithDefaults) => () => {
  const { at, radiusX, radiusY } = schema;

  const path = new Path2D();
  path.ellipse(at.x, at.y, radiusX, radiusY, 0, 0, 2 * Math.PI);
  return path;
};
