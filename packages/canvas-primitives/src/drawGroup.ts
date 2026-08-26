import { withScratchCanvas } from './offscreen.ts';
import type { Shape } from './types/index.ts';

/**
 * Draws a group of shapes with their text areas layered on
 * top to handle compositing.
 *
 * @param ctx - The main canvas rendering context
 * @param shapes - Shapes to draw as a group (e.g. all edges on a graph)
 */
export const drawGroup = (ctx: CanvasRenderingContext2D, shapes: Shape[]) => {
  if (shapes.length === 0) return;

  /*
    every property read here crosses the animated shape proxy, which does real
    work on the way through, so each shape is asked for its hole exactly once
    and the answer carries through the passes below
  */
  const group = shapes.map((shape) => ({
    shape,
    drawHole: shape.drawTextAreaHole,
  }));

  const punchesHoles = group.some(({ drawHole }) => drawHole);

  if (!punchesHoles) {
    for (const { shape } of group) shape.drawShape(ctx);
  } else {
    withScratchCanvas(ctx, (scratchCtx) => {
      for (const { shape } of group) shape.drawShape(scratchCtx);
      scratchCtx.globalCompositeOperation = 'destination-out';
      for (const { drawHole } of group) drawHole?.(scratchCtx);
    });
  }

  for (const { shape, drawHole } of group) {
    if (drawHole) shape.drawText?.(ctx);
    else shape.drawTextArea?.(ctx);
  }
};
