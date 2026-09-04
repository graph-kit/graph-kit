import type { TriangleSchemaWithDefaults } from './defaults.ts';

export const getTrianglePath = (schema: TriangleSchemaWithDefaults) => () => {
  const { pointA, pointB, pointC } = schema;

  const path = new Path2D();
  path.moveTo(pointA.x, pointA.y);
  path.lineTo(pointB.x, pointB.y);
  path.lineTo(pointC.x, pointC.y);
  path.closePath();
  return path;
};
