import { createAggregator } from '@canvas/primitives/aggregator/index';
import type { CanvasElement } from '@canvas/primitives/aggregator/types';
import { createAnimatedShapes } from '@canvas/primitives/animation/index';
import { createEventHub } from '@core/events/createEventHub';
import { nullThrows } from '@core/utils/assert';
import { getCtx } from '@core/utils/canvas/index';
import type { Cursor } from '@core/utils/cursor';

import { onBeforeUnmount, onMounted, ref } from 'vue';

import { type DrawPattern, useBackgroundPattern } from './backgroundPattern.ts';
import { useCamera } from './camera/index.ts';
import { useCanvasSize } from './canvasSize.ts';
import { useWorldCoordinates } from './coordinates/index.ts';
import { useVisibleWorldRect } from './coordinates/visibleWorldRect.ts';
import { useDevicePixelRatio } from './devicePixelRatio.ts';
import {
  createCanvasBoundEvents,
  createCanvasLifecycleEventRegistry,
  createDocumentBoundEvents,
  createElementsUnderCursor,
} from './events/index.ts';
import { syncCursor } from './syncCursor.ts';
import type { CanvasSurface } from './types.ts';

const REPAINT_FPS = 60;

// rAF on a 60hz display runs ~16.67ms apart but jitters, so 1ms of slack keeps
// every frame. on 120hz (8.33ms) it skips every other frame
const MS_PER_REPAINT = 1000 / REPAINT_FPS - 1;

export type CanvasSurfaceOptions = {
  /**
   * when this returns a cursor, the browser shows it anywhere on the canvas.
   * returning `undefined` falls back to the {@link CanvasElement.cursor} of
   * the canvas element under the pointer
   */
  cursorOverride?: () => Cursor | undefined;
};

export const useCanvasSurface = (
  options: CanvasSurfaceOptions = {},
): CanvasSurface => {
  const canvas = ref<HTMLCanvasElement>();

  const devicePixelRatio = useDevicePixelRatio();

  const { shapes, ...renderer } = createAnimatedShapes();
  const aggregator = createAggregator(renderer);

  const drawBackgroundPattern = ref<DrawPattern>(() => () => {});
  const contentSuspended = ref(false);
  const backgroundPatternSuspended = ref(false);

  const lifecycleEvents = createEventHub(createCanvasLifecycleEventRegistry());

  let repaintFrame: number | undefined;
  let ctx: CanvasRenderingContext2D | undefined;

  let lastRepaintAt = 0;
  const scheduleRepaint = () => {
    repaintFrame = requestAnimationFrame((now) => {
      scheduleRepaint();
      if (now - lastRepaintAt < MS_PER_REPAINT) return;
      repaintCanvas(now);
    });
  };

  const canvasSize = useCanvasSize({
    canvas,
    devicePixelRatio,
    onResize: () => repaintCanvas(performance.now()),
  });

  onMounted(() => {
    ctx = getCtx(canvas);
    scheduleRepaint();
    lifecycleEvents.emit('onMounted');
  });

  onBeforeUnmount(() => {
    lifecycleEvents.emit('onBeforeUnmount');
    cancelAnimationFrame(nullThrows(repaintFrame, 'rAF loop undefined'));
    ctx = undefined;
  });

  const canvasEvents = createCanvasBoundEvents(canvas, lifecycleEvents);
  const domEvents = createDocumentBoundEvents(lifecycleEvents);

  const camera = useCamera(canvas, canvasEvents, domEvents, devicePixelRatio);
  const { worldCoordinates: cursorCoordinates, toWorldCoordinates } =
    useWorldCoordinates(camera.state, canvasEvents);
  const visibleWorldRect = useVisibleWorldRect(camera.state, canvasSize);

  const { events: elementEvents, elementsUnderCursor } =
    createElementsUnderCursor({
      aggregator,
      cursorCoordinates,
      toWorldCoordinates,
      canvasEvents,
      domEvents,
    });

  syncCursor({
    subscribe: aggregator.events.subscribe,
    canvas,
    elementsUnderCursor,
    cursorOverride: options.cursorOverride,
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
      content: aggregator.draw,
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
