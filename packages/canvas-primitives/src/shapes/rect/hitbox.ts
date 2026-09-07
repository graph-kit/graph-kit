import { clamp } from '@core/utils/math';

import {
  areBoundingBoxesOverlapping,
  normalizeBoundingBox,
  rotatePoint,
  toBorderRadiusArray,
} from '../../helpers.ts';
import { circle } from '../../shapes/circle/index.ts';
import type { BoundingBox, Coordinate } from '../../types/utility.ts';
import type { RectSchemaWithDefaults } from './defaults.ts';

type HitboxRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type HitboxCircle = {
  center: Coordinate;
  radius: number;
};

/**
 * @param point - the point to check if it is in the rotated rectangle
 * @returns a function that checks if the point is in the rotated rectangle with rounded corners
 */
export const rectHitbox =
  (schema: RectSchemaWithDefaults) => (point: Coordinate) => {
    const { at, width, height, borderRadius, rotation, stroke } = schema;

    const {
      at: normalizedAt,
      width: normalizedWidth,
      height: normalizedHeight,
    } = normalizeBoundingBox({ at, width, height });

    const centerX = normalizedAt.x + normalizedWidth / 2;
    const centerY = normalizedAt.y + normalizedHeight / 2;

    const strokeWidth = stroke?.lineWidth || 0;
    const localPoint = rotatePoint(
      point,
      { x: centerX, y: centerY },
      -rotation,
    );

    const { x, y } = {
      x: centerX - normalizedWidth / 2,
      y: centerY - normalizedHeight / 2,
    };

    const noBorderRadius =
      (typeof borderRadius === 'number' && borderRadius === 0) ||
      (Array.isArray(borderRadius) && borderRadius.every((r) => r === 0));

    if (noBorderRadius) {
      return (
        localPoint.x >= x - strokeWidth / 2 &&
        localPoint.x <= x + normalizedWidth + strokeWidth / 2 &&
        localPoint.y >= y - strokeWidth / 2 &&
        localPoint.y <= y + normalizedHeight + strokeWidth / 2
      );
    }

    const radii = toBorderRadiusArray(schema.borderRadius);

    const maxRadius = Math.min(normalizedWidth / 2, normalizedHeight / 2);
    const [topLeftRadius, topRightRadius, bottomRightRadius, bottomLeftRadius] =
      radii.map((r) => clamp(r, 0, maxRadius));

    const rectangles: HitboxRect[] = [
      {
        x: x + topLeftRadius,
        y,
        width: normalizedWidth - topLeftRadius - topRightRadius,
        height: Math.max(topLeftRadius, topRightRadius),
      },
      {
        x: x + bottomLeftRadius,
        y: y + normalizedHeight - Math.max(bottomLeftRadius, bottomRightRadius),
        width: normalizedWidth - bottomLeftRadius - bottomRightRadius,
        height: Math.max(bottomLeftRadius, bottomRightRadius),
      },
      {
        x,
        y: y + topLeftRadius,
        width: Math.max(topLeftRadius, bottomLeftRadius),
        height: normalizedHeight - topLeftRadius - bottomLeftRadius,
      },
      {
        x: x + normalizedWidth - Math.max(topRightRadius, bottomRightRadius),
        y: y + topRightRadius,
        width: Math.max(topRightRadius, bottomRightRadius),
        height: normalizedHeight - topRightRadius - bottomRightRadius,
      },
      {
        x: x + Math.max(topLeftRadius, bottomLeftRadius),
        y: y + Math.max(topLeftRadius, topRightRadius),
        width:
          normalizedWidth -
          Math.max(topLeftRadius, bottomLeftRadius) -
          Math.max(topRightRadius, bottomRightRadius),
        height:
          normalizedHeight -
          Math.max(topLeftRadius, topRightRadius) -
          Math.max(bottomLeftRadius, bottomRightRadius),
      },
    ];

    for (const rect of rectangles) {
      if (
        rect.width > 0 &&
        rect.height > 0 &&
        localPoint.x >= rect.x - strokeWidth / 2 &&
        localPoint.x <= rect.x + rect.width + strokeWidth / 2 &&
        localPoint.y >= rect.y - strokeWidth / 2 &&
        localPoint.y <= rect.y + rect.height + strokeWidth / 2
      ) {
        return true;
      }
    }

    const corners: HitboxCircle[] = [
      {
        center: { x: x + topLeftRadius, y: y + topLeftRadius },
        radius: topLeftRadius,
      },
      {
        center: {
          x: x + normalizedWidth - topRightRadius,
          y: y + topRightRadius,
        },
        radius: topRightRadius,
      },
      {
        center: {
          x: x + normalizedWidth - bottomRightRadius,
          y: y + normalizedHeight - bottomRightRadius,
        },
        radius: bottomRightRadius,
      },
      {
        center: {
          x: x + bottomLeftRadius,
          y: y + normalizedHeight - bottomLeftRadius,
        },
        radius: bottomLeftRadius,
      },
    ];

    for (const corner of corners) {
      if (corner.radius > 0) {
        const circleHitbox = circle({
          at: corner.center,
          radius: corner.radius,
          stroke,
        }).hitbox;

        if (circleHitbox(localPoint)) {
          return true;
        }
      }
    }

    return false;
  };

export const getRectBoundingBox = (schema: RectSchemaWithDefaults) => () => {
  const { at, width, height, stroke } = schema;

  const strokeWidth = stroke?.lineWidth ?? 0;

  const normalizedWidth = Math.abs(width);
  const normalizedHeight = Math.abs(height);

  const adjustedX = width < 0 ? at.x + width : at.x;
  const adjustedY = height < 0 ? at.y + height : at.y;

  return normalizeBoundingBox({
    at: {
      x: adjustedX - strokeWidth / 2,
      y: adjustedY - strokeWidth / 2,
    },
    width: normalizedWidth + strokeWidth,
    height: normalizedHeight + strokeWidth,
  });
};

export const rectOverlapsBox =
  (schema: RectSchemaWithDefaults) => (boxToCheck: BoundingBox) =>
    areBoundingBoxesOverlapping(getRectBoundingBox(schema)(), boxToCheck);
