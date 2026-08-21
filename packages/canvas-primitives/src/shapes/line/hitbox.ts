import {
  areBoundingBoxesOverlapping,
  isPointInLine,
  normalizeBoundingBox,
} from '../../helpers.ts';
import type { BoundingBox, Coordinate } from '../../types/utility.ts';
import type { LineSchemaWithDefaults } from './defaults.ts';

/**
 * @param point - the point to check if it is in the line
 * @returns a function that checks if the point is in the line
 */
export const lineHitbox =
  (schema: LineSchemaWithDefaults) => (point: Coordinate) => {
    return isPointInLine(schema, point);
  };

export const getLineBoundingBox = (schema: LineSchemaWithDefaults) => () => {
  const { start, end, lineWidth } = schema;

  const minX = Math.min(start.x, end.x) - lineWidth / 2;
  const minY = Math.min(start.y, end.y) - lineWidth / 2;
  const maxX = Math.max(start.x, end.x) + lineWidth / 2;
  const maxY = Math.max(start.y, end.y) + lineWidth / 2;

  return normalizeBoundingBox({
    at: {
      x: minX,
      y: minY,
    },
    width: maxX - minX,
    height: maxY - minY,
  });
};

export const lineOverlapsBox = (schema: LineSchemaWithDefaults) => {
  const { start, end, lineWidth } = schema;

  const lineLength = Math.hypot(end.x - start.x, end.y - start.y);

  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const angleFactor = Math.abs(Math.cos(angle)) + Math.abs(Math.sin(angle));
  const segmentLength = Math.min(50, lineLength * angleFactor); // adjust segment length based on angle
  const numSegments = Math.ceil(lineLength / segmentLength);

  const dx = (end.x - start.x) / lineLength;
  const dy = (end.y - start.y) / lineLength;

  return (boxToCheck: BoundingBox) => {
    // initial check to see if close to line
    const inBoundingBox = areBoundingBoxesOverlapping(
      getLineBoundingBox(schema)(),
      boxToCheck,
    );

    if (!inBoundingBox) return false;

    // zero-length line (e.g. a scribble point recorded from a single click with no movement; aka a speck)
    if (lineLength === 0) return true;

    const segmentBoundBoxes = Array.from({ length: numSegments }, (_, i) => {
      const segmentStartX = start.x + dx * segmentLength * i;
      const segmentStartY = start.y + dy * segmentLength * i;
      const segmentEndX = segmentStartX + dx * segmentLength;
      const segmentEndY = segmentStartY + dy * segmentLength;

      const segMinX = Math.min(segmentStartX, segmentEndX) - lineWidth / 2;
      const segMinY = Math.min(segmentStartY, segmentEndY) - lineWidth / 2;
      const segWidth = Math.abs(segmentEndX - segmentStartX) + lineWidth;
      const segHeight = Math.abs(segmentEndY - segmentStartY) + lineWidth;

      return normalizeBoundingBox({
        at: { x: segMinX, y: segMinY },
        width: segWidth,
        height: segHeight,
      });
    });

    return segmentBoundBoxes.some((bb) =>
      areBoundingBoxesOverlapping(bb, boxToCheck),
    );
  };
};
