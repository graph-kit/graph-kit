/**
 * A scratch canvas for compositing, shared across the whole app.
 *
 * Allocating one per use was the single most expensive thing a frame did.
 * `drawGroup` runs once per priority group and every node is its own group, so
 * an N node graph was creating N+1 canvases the size of the entire viewport,
 * sixty times a second. At 1440p on a retina display that is a ~59MB backing
 * store each. Chrome recycles those aggressively enough to hide it; gecko and
 * webkit do not, which is the whole reason this file exists.
 *
 * Reuse means one at a time, and drawing is not always one at a time: a shape
 * can build nested shapes inside its own draw, and a nested one with a
 * no-matte text area wants a scratch surface while the outer one is still
 * using its own. So the pool is indexed by depth rather than being a single
 * canvas, and a nested acquire gets its own.
 */

const createScratchCtx = () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2d context not found on scratch canvas');
  return ctx;
};

const scratchByDepth: CanvasRenderingContext2D[] = [];
let depth = 0;

const targetByScratch = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>();

/**
 * the canvas a draw is ultimately for. a scratch pass hands its own canvas to
 * everything drawing into it, so anything asking which surface it is painting
 * for has to be told the one being composited onto
 */
export const getTargetCanvas = (canvas: HTMLCanvasElement) =>
  targetByScratch.get(canvas) ?? canvas;

const prepare = (
  scratch: CanvasRenderingContext2D,
  ctx: CanvasRenderingContext2D,
) => {
  const { width, height } = ctx.canvas;

  if (scratch.canvas.width !== width || scratch.canvas.height !== height) {
    // assigning either dimension resets the bitmap and every context property
    scratch.canvas.width = width;
    scratch.canvas.height = height;
  } else {
    scratch.resetTransform();
    scratch.clearRect(0, 0, width, height);
  }

  // the previous user may have left this mid punch
  scratch.globalCompositeOperation = 'source-over';
  scratch.setTransform(ctx.getTransform());

  targetByScratch.set(scratch.canvas, getTargetCanvas(ctx.canvas));
};

/**
 * Draws into an isolated surface matching the main canvas's pixel dimensions and
 * camera transform, then composites the result onto the main canvas.
 *
 * The isolation is what lets a caller erase pixels with `destination-out`
 * without taking out whatever was already on the main canvas underneath.
 */
export const withScratchCanvas = (
  ctx: CanvasRenderingContext2D,
  drawIntoScratch: (scratchCtx: CanvasRenderingContext2D) => void,
) => {
  const scratch = (scratchByDepth[depth] ??= createScratchCtx());
  depth++;

  try {
    prepare(scratch, ctx);
    drawIntoScratch(scratch);

    // transform is reset so scratch pixels map 1:1 onto the main canvas
    ctx.save();
    ctx.resetTransform();
    ctx.drawImage(scratch.canvas, 0, 0);
    ctx.restore();
  } finally {
    depth--;
  }
};
