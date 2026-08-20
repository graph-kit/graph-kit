import type { ReadonlyEventHub } from '@core/events/createEventHub';
import { nullThrows } from '@core/utils/assert';
import { MOUSE_BUTTONS } from '@core/utils/mouse';

import { type Ref, ref } from 'vue';

import { CANVAS_MISSING } from '../constants.ts';
import type {
  CanvasBoundEvents,
  DocumentBoundEvents,
} from '../events/index.ts';

export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 10;

export const ZOOM_SENSITIVITY = 0.02;
export const PAN_SENSITIVITY = 1;

export const usePanAndZoom = (
  canvas: Ref<HTMLCanvasElement | undefined>,
  canvasEvents: Pick<ReadonlyEventHub<CanvasBoundEvents>, 'subscribe'>,
  domEvents: Pick<ReadonlyEventHub<DocumentBoundEvents>, 'subscribe'>,
) => {
  const panX = ref(0);
  const panY = ref(0);
  const zoom = ref(1);

  const getCanvasRect = () =>
    nullThrows(canvas.value, CANVAS_MISSING).getBoundingClientRect();

  /** the point a button press zooms toward, since it has no cursor to zoom toward */
  const getCanvasCenter = () => {
    const { left, top, width, height } = getCanvasRect();
    return { clientX: left + width / 2, clientY: top + height / 2 };
  };

  const setZoom = (ev: Pick<WheelEvent, 'clientX' | 'clientY' | 'deltaY'>) => {
    const rect = getCanvasRect();
    const cx = ev.clientX - rect.left;
    const cy = ev.clientY - rect.top;

    // clamp deltaY to a max range to prevent mice with large deltaY notches from feeling too sensitive
    const normalizedDelta = Math.max(-100, Math.min(100, ev.deltaY));
    const zoomFactor = Math.exp(-normalizedDelta * ZOOM_SENSITIVITY);
    const clampedZoom = Math.min(
      MAX_ZOOM,
      Math.max(MIN_ZOOM, zoom.value * zoomFactor),
    );

    const scale = clampedZoom / zoom.value;

    panX.value = cx - (cx - panX.value) * scale;
    panY.value = cy - (cy - panY.value) * scale;
    zoom.value = clampedZoom;
  };

  const setPan = (ev: Pick<WheelEvent, 'deltaX' | 'deltaY'>) => {
    panX.value -= ev.deltaX * PAN_SENSITIVITY;
    panY.value -= ev.deltaY * PAN_SENSITIVITY;
  };

  const onWheel = (ev: WheelEvent) => {
    ev.preventDefault();

    const isPanning = !ev.ctrlKey;
    const maneuverCamera = isPanning ? setPan : setZoom;
    maneuverCamera(ev);
  };

  let lastX = 0;
  let lastY = 0;
  let middleMouseDown = false;

  const onMousedown = (ev: MouseEvent) => {
    middleMouseDown = ev.button === MOUSE_BUTTONS.middle;
    if (!middleMouseDown) return;

    lastX = ev.clientX;
    lastY = ev.clientY;
  };

  const onMousemove = (ev: MouseEvent) => {
    if (!middleMouseDown) return;

    setPan({
      deltaX: lastX - ev.clientX,
      deltaY: lastY - ev.clientY,
    });

    lastX = ev.clientX;
    lastY = ev.clientY;
  };

  const onMouseup = () => {
    lastX = 0;
    lastY = 0;
    middleMouseDown = false;
  };

  canvasEvents.subscribe('onWheel', onWheel);
  canvasEvents.subscribe('onMouseDown', onMousedown);
  canvasEvents.subscribe('onMouseMove', onMousemove);

  /*
    the release that ends a pan is the one the canvas never sees: dragging past
    the edge of the window and letting go there, which is why it comes off the
    document hub rather than the canvas one
  */
  domEvents.subscribe('onMouseUp', onMouseup);

  return {
    actions: {
      zoomIn: (increment = 12.5) =>
        setZoom({ deltaY: -increment, ...getCanvasCenter() }),
      zoomOut: (decrement = 12.5) =>
        setZoom({ deltaY: decrement, ...getCanvasCenter() }),
      /**
       * The whole camera at once, for taking on a viewport that was arrived at elsewhere
       * rather than steered toward here. Zoom is clamped because the range is this
       * camera's to enforce no matter where the numbers came from.
       */
      moveTo: (state: { panX: number; panY: number; zoom: number }) => {
        panX.value = state.panX;
        panY.value = state.panY;
        zoom.value = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, state.zoom));
      },
    },
    state: {
      panX,
      panY,
      zoom,
    },
    getTransform: () => ({
      scaleX: zoom.value,
      scaleY: zoom.value,
      translateX: panX.value,
      translateY: panY.value,
    }),
  };
};
