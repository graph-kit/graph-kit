import { createAggregator } from '@canvas/primitives/aggregator/index';
import { createAnimatedShapes } from '@canvas/primitives/animation/index';
import { createEventHub } from '@core/events/createEventHub';
import { nullThrows } from '@core/utils/assert';
import { getCtx } from '@core/utils/canvas/index';
import type { Cursor } from '@core/utils/cursor';

import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { type DrawPattern, useBackgroundPattern } from './backgroundPattern.ts';
import { useCamera } from './camera/index.ts';
import { CANVAS_MISSING } from './constants.ts';
import { useWorldCoordinates } from './coordinates/index.ts';
import { useVisibleWorldRect } from './coordinates/visibleWorldRect.ts';
import { setupCursor } from './cursor.ts';
import { useDevicePixelRatio } from './devicePixelRatio.ts';
import {
  createCanvasBoundEvents,
  createCanvasLifecycleEventRegistry,
  createDocumentBoundEvents,
  createElementsUnderCursor,
} from './events/index.ts';
import type { CanvasSurface } from './types.ts';

const REPAINT_FPS = 60;

/*
  the slack matters. a 60hz display does not hand out frames exactly 16.667ms
  apart, so comparing against the period on the nose rejects the frame that
  arrives at 16.6 and waits for the next one, halving the rate to 30. a
  millisecond of give takes every frame on a 60hz screen and still rejects the
  8.3ms half frames a 120hz screen offers
*/
const MS_PER_REPAINT = 1000 / REPAINT_FPS - 1;

/**
 * sizes the canvas's backing store to its layout box at the given device pixel
 * ratio, handing back that box in css pixels and whether the backing store
 * actually moved
 */
const sizeCanvas = (canvasRef: HTMLCanvasElement | undefined, dpr: number) => {
  const canvas = nullThrows(canvasRef, CANVAS_MISSING);

  const rect = canvas.getBoundingClientRect();
  const width = Math.round(rect.width * dpr);
  const height = Math.round(rect.height * dpr);

  const resized = canvas.width !== width || canvas.height !== height;
  if (resized) {
    canvas.width = width;
    canvas.height = height;
  }

  return { rect, resized };
};

export type CanvasSurfaceOptions = {
  /**
   * a cursor for the whole canvas, overriding whatever the pointer is over.
   * `undefined` defers to the element beneath it, which is the usual answer
   */
  canvasCursor?: () => Cursor | undefined;
};

export const useCanvasSurface = (
  options: CanvasSurfaceOptions = {},
): CanvasSurface => {
  const canvas = ref<HTMLCanvasElement>();

  /** the layout box as of the last resize, in css pixels */
  const canvasCssSize = { width: ref(0), height: ref(0) };

  /*
    one ratio for the whole surface. sizing the backing store and scaling the
    context are the same decision, and a browser zoom that moved one but not the
    other left every hit test off by the difference
  */
  const dpr = useDevicePixelRatio();

  const { shapes, ...renderer } = createAnimatedShapes();
  const aggregator = createAggregator(renderer);

  const drawBackgroundPattern = ref<DrawPattern>(() => () => {});
  const contentSuspended = ref(false);
  const backgroundPatternSuspended = ref(false);

  const lifecycleEvents = createEventHub(createCanvasLifecycleEventRegistry());

  let repaintFrame: number | undefined;
  let resizeObserver: ResizeObserver | undefined;
  /*
    resolved once per canvas element rather than per frame. getContext hands
    back the same context every time, but the lookup itself was showing up 60
    times a second for no reason
  */
  let ctx: CanvasRenderingContext2D | undefined;

  /*
    the loop follows the browser's frame instead of a timer that drifts against
    it. a setInterval that overruns its own period queues the next repaint
    immediately and never gets to skip one, which is how a slow frame turned
    into a permanently behind one on gecko and webkit

    the cap keeps the workload where it was: rAF runs at the display's refresh
    rate, so a 120hz screen would otherwise silently double the number of
    frames drawn per second
  */
  let lastRepaintAt = 0;

  const scheduleRepaint = () => {
    repaintFrame = requestAnimationFrame((now) => {
      scheduleRepaint();
      if (now - lastRepaintAt < MS_PER_REPAINT) return;
      repaintCanvas(now);
    });
  };

  const resizeCanvas = () => {
    const { rect, resized } = sizeCanvas(canvas.value, dpr.value);
    canvasCssSize.width.value = rect.width;
    canvasCssSize.height.value = rect.height;
    return resized;
  };

  const resizeAndRepaint = () => {
    if (!resizeCanvas()) return;
    repaintCanvas(performance.now());
  };

  /*
    a density change does not always move the layout box, so dragging the window
    to another display can leave the observer with nothing to report
  */
  watch(dpr, resizeAndRepaint);

  onMounted(() => {
    ctx = getCtx(canvas);
    resizeCanvas();
    scheduleRepaint();
    lifecycleEvents.emit('onMounted');

    resizeObserver = new ResizeObserver(resizeAndRepaint);
    resizeObserver.observe(nullThrows(canvas.value, CANVAS_MISSING));
  });

  onBeforeUnmount(() => {
    lifecycleEvents.emit('onBeforeUnmount');
    if (repaintFrame !== undefined) cancelAnimationFrame(repaintFrame);
    resizeObserver?.disconnect();
    resizeObserver = undefined;
    ctx = undefined;
  });

  const canvasEvents = createCanvasBoundEvents(canvas, lifecycleEvents);
  const domEvents = createDocumentBoundEvents(lifecycleEvents);

  const camera = useCamera(canvas, canvasEvents, domEvents, dpr);
  const { worldCoordinates: cursorCoordinates, toWorldCoordinates } =
    useWorldCoordinates(camera.state, canvasEvents);
  const visibleWorldRect = useVisibleWorldRect(camera.state, canvasCssSize);

  const { events: elementEvents, elementsUnderCursor } =
    createElementsUnderCursor({
      aggregator,
      cursorCoordinates,
      toWorldCoordinates,
      canvasEvents,
      domEvents,
    });

  setupCursor({
    subscribe: aggregator.events.subscribe,
    canvas,
    elementsUnderCursor,
    canvasCursor: options.canvasCursor,
  });

  const pattern = useBackgroundPattern(
    camera.state,
    drawBackgroundPattern,
    visibleWorldRect,
  );

  const repaintCanvas = (now: number) => {
    if (!ctx) return;
    lastRepaintAt = now;
    renderer.tick(now);
    lifecycleEvents.emit('onBeforeRepaint');
    camera.transformAndClear(ctx);
    if (!backgroundPatternSuspended.value) pattern.draw(ctx);
    if (!contentSuspended.value) aggregator.draw(ctx);
    lifecycleEvents.emit('onAfterRepaint');
  };

  return {
    canvas,
    camera,
    cursorCoordinates,
    toWorldCoordinates,
    visibleWorldRect,
    ref: {
      canvasRef: (ref) => (canvas.value = ref),
    },
    draw: {
      backgroundPattern: drawBackgroundPattern,
      contentSuspended,
      backgroundPatternSuspended,
    },
    aggregator,
    shapes,
    renderer,
    elementsUnderCursor,
    events: {
      canvas: canvasEvents,
      dom: domEvents,
      elements: elementEvents,
      lifecycle: lifecycleEvents,
    },
  };
};
