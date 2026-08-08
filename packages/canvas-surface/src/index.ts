import { getCtx, getDevicePixelRatio } from '@core/utils/canvas/index';
import { createEventHub } from '@graph/primitives/events/createEventHub';
import { useElementSize } from '@vueuse/core';

import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { type DrawPattern, useBackgroundPattern } from './backgroundPattern.ts';
import { useCamera } from './camera/index.ts';
import { useWorldCoordinates } from './coordinates/index.ts';
import { createCanvasLifecycleEventRegistry } from './events.ts';
import type { DrawContent, UseCanvas } from './types.ts';

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
 * measures the canvas, sizes its backing store to match at the current device
 * pixel ratio, and hands the measurement back so callers that need the canvas's
 * screen position do not have to pay for a second layout to get it
 */
const measureAndSizeCanvas = (canvas: HTMLCanvasElement | undefined) => {
  if (!canvas) throw new Error('Canvas not found in DOM. Check ref link.');

  const dpr = getDevicePixelRatio();
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  return rect;
};

export const useCanvas: UseCanvas = () => {
  const canvas = ref<HTMLCanvasElement>();
  const canvasBoxSize = useElementSize(canvas);

  const drawContent = ref<DrawContent>(() => {});
  const drawBackgroundPattern = ref<DrawPattern>(() => () => {});

  /*
    the background pattern needs the canvas's screen position to work out which
    slice of the world is visible, and reading it forces layout. the canvas
    fills the viewport, so the only thing that moves it is a resize, which is
    already being watched
  */
  let canvasRect: Pick<DOMRect, 'left' | 'top'> = { left: 0, top: 0 };

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
      repaintCanvas();
    });
  };

  onMounted(() => {
    canvasRect = measureAndSizeCanvas(canvas.value);
    ctx = getCtx(canvas);
    scheduleRepaint();
    lifecycleEvents.emit('onMounted');
  });

  onBeforeUnmount(() => {
    lifecycleEvents.emit('onBeforeUnmount');
  });

  watch([canvasBoxSize.width, canvasBoxSize.height], () => {
    canvasRect = measureAndSizeCanvas(canvas.value);
    ctx = getCtx(canvas);
  });

  const { cleanup: cleanupCamera, ...camera } = useCamera(canvas);
  const { worldCoordinates: cursorCoordinates, cleanup: cleanupCoords } =
    useWorldCoordinates(canvas);

  const pattern = useBackgroundPattern(camera.state, drawBackgroundPattern);

  const repaintCanvas = () => {
    if (!ctx) return;
    lifecycleEvents.emit('onBeforeRepaint');
    camera.transformAndClear(ctx);
    pattern.draw(ctx, canvasRect);
    drawContent.value(ctx);
    lifecycleEvents.emit('onAfterRepaint');
  };

  return {
    canvas,
    camera,
    cursorCoordinates,
    ref: {
      canvasRef: (ref) => (canvas.value = ref),
      cleanup: (ref) => {
        cleanupCoords(ref);
        cleanupCamera(ref);
        if (repaintFrame !== undefined) cancelAnimationFrame(repaintFrame);
        ctx = undefined;
      },
    },
    draw: {
      content: drawContent,
      backgroundPattern: drawBackgroundPattern,
    },
    lifecycleEvents,
  };
};
