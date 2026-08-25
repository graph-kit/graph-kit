import { withScratchCanvas } from './offscreen.ts';
import type { Shape } from './types/index.ts';

/**
 * Draws a group of shapes with their text areas cleanly layered on top,
 * using a single shared offscreen canvas to handle compositing correctly
 * even when shapes cross each other's text areas.
 *
 * ## Why this is necessary
 *
 * When shapes are drawn independently, each shape's text area matte covers
 * whatever was drawn before it — including lines from other shapes crossing
 * through that text area. For straight edges on a graph this is especially
 * visible: a crossing edge gets cut off at the text label boundary.
 *
 * ## How it works
 *
 * 1. All shapes are drawn to a single offscreen canvas.
 * 2. Every text area is punched transparent using `destination-out` compositing.
 *    Because all shapes share the same offscreen canvas, a crossing edge's
 *    line is already present when the hole is punched — it gets erased along
 *    with the label's own edge, leaving clean transparency.
 * 3. The offscreen canvas is composited onto the main canvas. Whatever was
 *    drawn beneath (background pattern, shapes outside the group) shows through
 *    the transparent holes naturally.
 * 4. Text labels are drawn directly on the main canvas on top of everything.
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
    for (const { shape } of group) {
      shape.drawShape(ctx);
    }
  } else {
    console.log('shape drawn', shapes);
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
