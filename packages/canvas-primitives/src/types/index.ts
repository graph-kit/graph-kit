// @typescript-eslint/no-unused-vars reports unused even if referenced in jsdoc
// eslint-disable-next-line
import type { UnionToIntersection } from 'ts-essentials';

import type { ShapeFactoryWrapper } from '../shapeWrapper.ts';
import type { ArrowSchema } from '../shapes/arrow/types.ts';
import type { CircleSchema } from '../shapes/circle/types.ts';
import type { CrossSchema } from '../shapes/cross/types.ts';
import type { EllipseSchema } from '../shapes/ellipse/types.ts';
import type { ImageSchema } from '../shapes/image/types.ts';
import type { LineSchema } from '../shapes/line/types.ts';
import type { RectSchema } from '../shapes/rect/types.ts';
import type { RegionSchema } from '../shapes/region/types.ts';
import type { ScribbleSchema } from '../shapes/scribble/types.ts';
import type { SquareSchema } from '../shapes/square/types.ts';
import type { StarSchema } from '../shapes/star/types.ts';
import type { TriangleSchema } from '../shapes/triangle/types.ts';
import type { UTurnSchema } from '../shapes/uturn/types.ts';
import type { StartTextAreaEdit } from '../text/types.ts';
import type { BoundingBox, Coordinate } from './utility.ts';

export type ShapeName =
  | 'circle'
  | 'line'
  | 'square'
  | 'rect'
  | 'triangle'
  | 'arrow'
  | 'uturn'
  | 'cross'
  | 'scribble'
  | 'ellipse'
  | 'star'
  | 'image'
  | 'region';

/**
 * interface for shapes that support text areas
 */
export type ShapeTextProps = {
  /**
   * draws the text area by calling `drawTextAreaMatte` then `drawText`
   */
  drawTextArea: (ctx: CanvasRenderingContext2D) => void;
  /**
   * only draws the matte of the text area
   */
  drawTextAreaMatte: (ctx: CanvasRenderingContext2D) => void;
  /**
   * fills the text area bounds with an opaque rect, for use with destination-out
   * compositing to punch a transparent hole. unlike `drawTextAreaMatte`, this
   * always draws opaquely regardless of the text area's color setting.
   */
  drawTextAreaHole?: (ctx: CanvasRenderingContext2D) => void;
  /**
   * only draws the text content of the text area
   */
  drawText: (ctx: CanvasRenderingContext2D) => void;
  /**
   * returns true if the point is within the text area
   */
  textHitbox: (point: Coordinate) => boolean;
  /**
   * starts a text editing session.
   */
  startTextAreaEdit: StartTextAreaEdit;
};

export type ShapeProps = {
  /**
   * the name of the shape type, ie `"circle"`, `"line"`, etc
   */
  name: ShapeName;

  /**
   * draws the shape and the text area
   */
  draw: (ctx: CanvasRenderingContext2D) => void;

  /**
   * draws the shape without the text area
   */
  drawShape: (ctx: CanvasRenderingContext2D) => void;

  /**
   * returns true if `shapeHitbox` or `textHitbox` are true
   */
  hitbox: (point: Coordinate) => boolean;

  /**
   * returns true if the point is within the shape, not including text area
   */
  shapeHitbox: (point: Coordinate) => boolean;

  /**
   * returns true if `boxToCheck` overlaps the shape, not including text area.
   *
   * this is the region query behind the marquee and the eraser, not a cheaper
   * {@link ShapeProps.shapeHitbox | shapeHitbox}. it is deliberately generous:
   * a line tests against the bounding boxes of its segments and a rect ignores
   * its rotation and border radius, so a box that never touches the drawn shape
   * can still come back true. pass a zero area box and it costs more than the
   * point test it looks like it is replacing
   */
  overlapsBox: (boxToCheck: BoundingBox) => boolean;

  /**
   * returns the coordinates of the top-left corner along with the width and height
   * of the area comprising the bounding box
   */
  getBoundingBox: () => BoundingBox;

  /**
   * this shape's fill outline, in world coordinates.
   *
   * ℹ️ present only on shapes with an interior to enclose. a stroke-only shape
   * such as a line has no path, because what it paints is the stroke itself
   */
  path?: () => Path2D;
} & Partial<ShapeTextProps>;

/**
 * props added to every shape in {@link ShapeFactoryWrapper}
 */
export type ShapeWrapperProps = {
  /**
   * returns the coordinates of the center of the shape's bounding box
   */
  getCenterPoint: () => Coordinate;
};

export type Shape = ShapeProps & ShapeWrapperProps;

/**
 * the process all schemas go through to become shapes
 */
export type ShapeFactory<T> = (schema: T) => Shape;

export type SchemaId = string;

export type WithId<T> = T & {
  /**
   * a unique id to track this shape
   */
  id: SchemaId;
};

export type ShapeNameToSchema = {
  arrow: ArrowSchema;
  circle: CircleSchema;
  cross: CrossSchema;
  ellipse: EllipseSchema;
  image: ImageSchema;
  line: LineSchema;
  rect: RectSchema;
  region: RegionSchema;
  scribble: ScribbleSchema;
  square: SquareSchema;
  star: StarSchema;
  triangle: TriangleSchema;
  uturn: UTurnSchema;
};

export type EverySchemaProp = ShapeNameToSchema[keyof ShapeNameToSchema];
export type EverySchemaPropName = keyof UnionToIntersection<EverySchemaProp>;

/**
 * all properties on the shape object as a runtime value
 */
export const shapeProps: Set<keyof Shape> = new Set([
  'drawTextAreaMatte',
  'drawTextAreaHole',
  'drawText',
  'drawTextArea',
  'textHitbox',
  'startTextAreaEdit',
  'name',
  'draw',
  'drawShape',
  'hitbox',
  'shapeHitbox',
  'overlapsBox',
  'getBoundingBox',
  'getCenterPoint',
  'path',
]);
