import type { ShapeNameToSchema } from '../../types/index.ts';
import type { FillColor, FillHatch } from '../../types/schema.ts';
import type { BoundingBox } from '../../types/utility.ts';

/**
 * the shapes a region can be composed from: those with an interior to be
 * inside or outside of. a stroke-only shape encloses nothing, and a region
 * cannot be built from regions
 */
export type RegionMemberName =
  'circle' | 'ellipse' | 'rect' | 'square' | 'triangle';

/**
 * one shape in a region's composition, named rather than built.
 *
 * ℹ️ a member is geometry, not paint: whatever `stroke`, `textArea` and fill it
 * carries is dropped, so what a region clips and what it hit tests can never
 * disagree
 */
export type RegionMember = {
  [Name in RegionMemberName]: { shape: Name } & ShapeNameToSchema[Name];
}[RegionMemberName];

/**
 * the area inside every one of `inside` and outside every one of `outside`,
 * within `bounds`.
 *
 * ℹ️ every field is plain data on purpose. the animation system snapshots
 * schemas through a json round trip, which would reduce a live `Shape` to its
 * name and leave a ghost with nothing to draw
 */
export type RegionSchema = {
  /** the region is inside every one of these; empty means "all of `bounds`" */
  inside: readonly RegionMember[];
  /** and outside every one of these */
  outside: readonly RegionMember[];
  /**
   * the finite area the region is taken within: the universe an "outside" is
   * measured against, and the extent the fill covers.
   *
   * ℹ️ required, because "outside a circle" is unbounded without it, and an
   * unbounded region has no usable bounding box or center point
   */
  bounds: BoundingBox;
} & FillColor &
  FillHatch;
