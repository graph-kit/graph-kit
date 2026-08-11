import { withScratchCanvas } from '../offscreen.ts';
import type { PlacedTextArea } from './defaults.ts';
import type { getTextAreaDimension } from './text.ts';

type DrawFn = (ctx: CanvasRenderingContext2D) => void;
type TextAreaDimensions = ReturnType<typeof getTextAreaDimension>;

/**
 * Punches a transparent rectangle into the offscreen canvas at the text area's position.
 * Uses destination-out compositing so only pixels within the rect are erased.
 */
const punchTextAreaHole = (
  offCtx: CanvasRenderingContext2D,
  textArea: PlacedTextArea,
  dimensions: TextAreaDimensions,
) => {
  offCtx.globalCompositeOperation = 'destination-out';
  offCtx.fillRect(
    textArea.at.x,
    textArea.at.y,
    dimensions.width,
    dimensions.height,
  );
  offCtx.globalCompositeOperation = 'source-over';
};

/**
 * Draws a shape with a no-matte text area using offscreen canvas compositing.
 *
 * Instead of painting a solid matte behind the text, the shape is rendered to an
 * offscreen canvas where the text area is punched transparent with destination-out
 * compositing. The result is then composited onto the main canvas, leaving whatever
 * was drawn beneath (e.g. background pattern, other shapes) visible through the
 * text area. Text is then drawn directly on the main canvas on top.
 *
 * This keeps all compositing complexity isolated to the shapes layer — callers
 * simply pass `color: 'none'` on the text area schema.
 */
export const drawWithNoMatte = (
  ctx: CanvasRenderingContext2D,
  drawShape: DrawFn,
  textArea: PlacedTextArea,
  dimensions: TextAreaDimensions,
  drawText: DrawFn,
) => {
  withScratchCanvas(ctx, (scratchCtx) => {
    drawShape(scratchCtx);
    punchTextAreaHole(scratchCtx, textArea, dimensions);
  });

  drawText(ctx);
};
