import { resolveArrowDefaults } from '../shapes/arrow/defaults.ts';
import { resolveCircleDefaults } from '../shapes/circle/defaults.ts';
import { resolveCrossDefaults } from '../shapes/cross/defaults.ts';
import { resolveEllipseDefaults } from '../shapes/ellipse/defaults.ts';
import { resolveImageDefaults } from '../shapes/image/defaults.ts';
import { resolveLineDefaults } from '../shapes/line/defaults.ts';
import { resolveRectDefaults } from '../shapes/rect/defaults.ts';
import { resolveRegionDefaults } from '../shapes/region/defaults.ts';
import { resolveScribbleDefaults } from '../shapes/scribble/defaults.ts';
import { resolveSquareDefaults } from '../shapes/square/defaults.ts';
import { resolveStarDefaults } from '../shapes/star/defaults.ts';
import { resolveTriangleDefaults } from '../shapes/triangle/defaults.ts';
import { resolveUTurnDefaults } from '../shapes/uturn/defaults.ts';

export const getSchemaWithDefaults = {
  arrow: resolveArrowDefaults,
  circle: resolveCircleDefaults,
  cross: resolveCrossDefaults,
  ellipse: resolveEllipseDefaults,
  image: resolveImageDefaults,
  line: resolveLineDefaults,
  rect: resolveRectDefaults,
  region: resolveRegionDefaults,
  scribble: resolveScribbleDefaults,
  square: resolveSquareDefaults,
  star: resolveStarDefaults,
  triangle: resolveTriangleDefaults,
  uturn: resolveUTurnDefaults,
} as const;

export type SchemaWithDefaults = {
  [K in keyof typeof getSchemaWithDefaults]: ReturnType<
    (typeof getSchemaWithDefaults)[K]
  >;
};
