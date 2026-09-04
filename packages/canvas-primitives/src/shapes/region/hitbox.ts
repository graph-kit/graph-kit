import {
  areBoundingBoxesOverlapping,
  isPointInBoundingBox,
  normalizeBoundingBox,
} from '../../helpers.ts';
import type { BoundingBox, Coordinate } from '../../types/utility.ts';
import type { RegionSchemaWithDefaults } from './defaults.ts';
import { memberShape } from './members.ts';

export const regionHitbox =
  (schema: RegionSchemaWithDefaults) => (point: Coordinate) => {
    const { inside, outside, bounds } = schema;

    if (!isPointInBoundingBox(bounds, point)) return false;

    for (const member of inside) {
      if (!memberShape(member).shapeHitbox(point)) return false;
    }

    for (const member of outside) {
      if (memberShape(member).shapeHitbox(point)) return false;
    }

    return true;
  };

const intersect = (first: BoundingBox, second: BoundingBox): BoundingBox => {
  const left = Math.max(first.at.x, second.at.x);
  const top = Math.max(first.at.y, second.at.y);
  const right = Math.min(first.at.x + first.width, second.at.x + second.width);
  const bottom = Math.min(
    first.at.y + first.height,
    second.at.y + second.height,
  );

  return {
    at: { x: left, y: top },
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
};

/**
 * ℹ️ `outside` never narrows this. taking a hole out of the middle of a region
 * does not move its edges
 */
export const getRegionBoundingBox =
  (schema: RegionSchemaWithDefaults) => () => {
    const { inside, bounds } = schema;

    let box = normalizeBoundingBox(bounds);
    for (const member of inside) {
      box = intersect(box, memberShape(member).getBoundingBox());
    }

    return box;
  };

export const regionOverlapsBox =
  (schema: RegionSchemaWithDefaults) => (boxToCheck: BoundingBox) =>
    areBoundingBoxesOverlapping(getRegionBoundingBox(schema)(), boxToCheck);
