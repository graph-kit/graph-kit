import { normalizeBoundingBox, toBorderRadiusArray } from '../../helpers.ts';
import type { RectSchemaWithDefaults } from './defaults.ts';

export const getRectPath = (schema: RectSchemaWithDefaults) => () => {
  const { at, width, height, borderRadius, rotation } = schema;

  const {
    at: normalizedAt,
    width: normalizedWidth,
    height: normalizedHeight,
  } = normalizeBoundingBox({ at, width, height });

  const maxRadius = Math.min(normalizedWidth / 2, normalizedHeight / 2);
  const corners = toBorderRadiusArray(borderRadius).map((corner) =>
    Math.min(corner, maxRadius),
  );

  // built around the origin so the rotation below is a plain rotate about it
  const centered = new Path2D();
  centered.roundRect(
    -normalizedWidth / 2,
    -normalizedHeight / 2,
    normalizedWidth,
    normalizedHeight,
    corners,
  );

  /*
    addPath takes a DOMMatrix2DInit, which is a dictionary rather than a
    DOMMatrix, so the rotation costs no constructor that the test environment
    would have to provide
  */
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  const path = new Path2D();
  path.addPath(centered, {
    a: cos,
    b: sin,
    c: -sin,
    d: cos,
    e: normalizedAt.x + normalizedWidth / 2,
    f: normalizedAt.y + normalizedHeight / 2,
  });
  return path;
};
