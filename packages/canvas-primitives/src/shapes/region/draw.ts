import { hatchPattern } from '../../paint/hatch.ts';
import type { BoundingBox } from '../../types/utility.ts';
import type { RegionSchemaWithDefaults } from './defaults.ts';
import { memberShape } from './members.ts';

const boundsPath = (bounds: BoundingBox) => {
  const path = new Path2D();
  path.rect(bounds.at.x, bounds.at.y, bounds.width, bounds.height);
  return path;
};

const memberPath = (member: Parameters<typeof memberShape>[0]) => {
  const shape = memberShape(member);
  if (!shape.path) {
    throw new Error(`region member "${shape.name}" has no path to clip to`);
  }
  return shape.path();
};

export const drawRegionWithCtx =
  (schema: RegionSchemaWithDefaults) => (ctx: CanvasRenderingContext2D) => {
    const { inside, outside, bounds, fillColor, fillHatch } = schema;

    // nothing to paint, so nothing is built: a region can exist for its hitbox alone
    if (!fillHatch && !fillColor) return;

    ctx.save();

    /*
      region is the only primitive that touches the clip, and neither drawGroup
      nor the aggregator isolates one shape from the next. a throw that skipped
      the restore would clip everything drawn for the rest of the frame
    */
    try {
      // taken first, so an even-odd punch below cannot admit anything outside it
      ctx.clip(boundsPath(bounds));

      for (const member of inside) ctx.clip(memberPath(member));

      for (const member of outside) {
        // the member punches a hole in bounds under the even odd rule
        const punch = boundsPath(bounds);
        punch.addPath(memberPath(member));
        ctx.clip(punch, 'evenodd');
      }

      if (fillHatch) {
        // a hatch is pixels, and interpolating them turns the stripes to mush
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = hatchPattern(
          ctx,
          fillHatch.colors,
          fillHatch.stripeWidth,
        );
      } else if (fillColor) {
        ctx.fillStyle = fillColor;
      }

      ctx.fillRect(bounds.at.x, bounds.at.y, bounds.width, bounds.height);
    } finally {
      ctx.restore();
    }
  };
