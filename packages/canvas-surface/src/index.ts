import { createAggregator } from '@canvas/primitives/aggregator/index';
import { createAnimatedShapes } from '@canvas/primitives/animation/index';
import { createEventHub } from '@core/events/createEventHub';
import { nullThrows } from '@core/utils/assert';
import { getCtx, getDevicePixelRatio } from '@core/utils/canvas/index';
import { useElementSize } from '@vueuse/core';

import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { type DrawPattern, useBackgroundPattern } from './backgroundPattern.ts';
import { useCamera } from './camera/index.ts';
import { CANVAS_MISSING } from './constants.ts';
import { useWorldCoordinates } from './coordinates/index.ts';
import { useVisibleWorldRect } from './coordinates/visibleWorldRect.ts';
import {
  createCanvasBoundEvents,
  createCanvasLifecycleEventRegistry,
  createDocumentBoundEvents,
  createElementsUnderCursor,
} from './events/index.ts';
import type { CanvasSurface, DrawContent } from './types.ts';

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
 * sizes the canvas's backing store to its layout box at the current device
 * pixel ratio, handing back that box in css pixels
 */
const sizeCanvas = (canvasRef: HTMLCanvasElement | undefined) => {
  const canvas = nullThrows(canvasRef, CANVAS_MISSING);

  const dpr = getDevicePixelRatio();
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  return rect;
};

export const useCanvasSurface = (): CanvasSurface => {
  const canvas = ref<HTMLCanvasElement>();
  const canvasBoxSize = useElementSize(canvas);

  /*
    the layout box as of the last resize, not useElementSize's copy of it, which
    reads 0 until its ResizeObserver fires a frame after mount
  */
  const canvasCssSize = { width: ref(0), height: ref(0) };

  const { shapes, ...renderer } = createAnimatedShapes();
  const aggregator = createAggregator(renderer);

  const drawContent = ref<DrawContent>(aggregator.draw);
  const drawBackgroundPattern = ref<DrawPattern>(() => () => {});
  const contentSuspended = ref(false);

  const lifecycleEvents = createEventHub(createCanvasLifecycleEventRegistry());

  let repaintFrame: number | undefined;
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
      lastRepaintAt = now;
      repaintCanvas(now);
    });
  };

  const resizeCanvas = () => {
    const { width, height } = sizeCanvas(canvas.value);
    canvasCssSize.width.value = width;
    canvasCssSize.height.value = height;
    ctx = getCtx(canvas);
  };

  onMounted(() => {
    resizeCanvas();
    scheduleRepaint();
    lifecycleEvents.emit('onMounted');
  });

  onBeforeUnmount(() => {
    lifecycleEvents.emit('onBeforeUnmount');
    if (repaintFrame !== undefined) cancelAnimationFrame(repaintFrame);
    ctx = undefined;
  });

  watch([canvasBoxSize.width, canvasBoxSize.height], resizeCanvas);

  const canvasEvents = createCanvasBoundEvents(canvas, lifecycleEvents);
  const domEvents = createDocumentBoundEvents(lifecycleEvents);

  const camera = useCamera(canvas, canvasEvents, domEvents);
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

  const pattern = useBackgroundPattern(
    camera.state,
    drawBackgroundPattern,
    visibleWorldRect,
  );

  const repaintCanvas = (now: number) => {
    if (!ctx) return;
    renderer.tick(now);
    lifecycleEvents.emit('onBeforeRepaint');
    camera.transformAndClear(ctx);
    pattern.draw(ctx);
    if (!contentSuspended.value) drawContent.value(ctx);
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
      content: drawContent,
      backgroundPattern: drawBackgroundPattern,
      contentSuspended,
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
