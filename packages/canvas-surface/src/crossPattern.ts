import { cross } from '@canvas/primitives/shapes/cross/index';

import type { DrawPattern } from './backgroundPattern.ts';

const SIZE = 12;
const LINE_WIDTH = 1;

/**
 * the field of crosses drawn behind canvas content.
 *
 * everything that does not depend on where a cell lands is hoisted out of the
 * stamp: the color lookup, and the cross itself, which resolves its schema,
 * builds the three bars it draws with, and builds a hitbox, a bounding box and
 * text props the pattern never asks for. what is left per cell is a translate
 * and a draw
 *
 * @param patternColor resolves the cross color for the alpha the surface hands
 * down, which follows zoom and so is the same for every cell in a frame
 */
export const crossPattern =
  (patternColor: (alpha: string) => string): DrawPattern =>
  (ctx, alpha) => {
    // built at the origin so the per cell translate is what places each stamp
    const cell = cross({
      at: { x: 0, y: 0 },
      size: SIZE,
      lineWidth: LINE_WIDTH,
      fillColor: patternColor(alpha),
    });

    return (at) => {
      ctx.save();
      ctx.translate(at.x, at.y);
      cell.draw(ctx);
      ctx.restore();
    };
  };
