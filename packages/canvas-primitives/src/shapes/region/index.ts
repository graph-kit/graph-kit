import { shapeFactoryWrapper } from '../../shapeWrapper.ts';
import type { ShapeFactory } from '../../types/index.ts';
import { resolveRegionDefaults } from './defaults.ts';
import { drawRegionWithCtx } from './draw.ts';
import {
  getRegionBoundingBox,
  regionHitbox,
  regionOverlapsBox,
} from './hitbox.ts';
import type { RegionSchema } from './types.ts';

export const region: ShapeFactory<RegionSchema> = (options) => {
  if (options.bounds.width < 0 || options.bounds.height < 0) {
    throw new Error('region bounds must have a positive width and height');
  }

  const schema = resolveRegionDefaults(options);

  const drawShape = drawRegionWithCtx(schema);
  const shapeHitbox = regionHitbox(schema);

  return shapeFactoryWrapper({
    name: 'region',

    // a region has no text area, so there is nothing for draw to add
    draw: drawShape,
    drawShape,

    hitbox: shapeHitbox,
    shapeHitbox,

    overlapsBox: regionOverlapsBox(schema),
    getBoundingBox: getRegionBoundingBox(schema),
  });
};
