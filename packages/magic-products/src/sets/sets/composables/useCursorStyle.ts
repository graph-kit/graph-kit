import { CanvasProps } from '@canvas/surface/types';
import { CURSOR } from '@core/utils/cursor';

import { Ref, computed, onBeforeUnmount, onMounted, ref } from 'vue';

import type { SetDefinition } from '../../types.ts';
import { isInsideCircle, isOnEdge } from '../other/circleUtils.ts';

const getAngleBetweenTwoPoints = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) => {
  return Math.atan2(Math.abs(y1 - y2), Math.abs(x1 - x2));
};

const useMouseDown = (surface: CanvasProps) => {
  const isMouseDown = ref(false);

  const setMouseDown = () => (isMouseDown.value = true);
  const setMouseUp = () => (isMouseDown.value = false);

  surface.domEvents.subscribe('onMouseDown', setMouseDown);
  surface.domEvents.subscribe('onMouseUp', setMouseUp);

  const cleanup = () => {
    surface.domEvents.unsubscribe('onMouseDown', setMouseDown);
    surface.domEvents.unsubscribe('onMouseUp', setMouseUp);
  };

  onBeforeUnmount(cleanup);

  return isMouseDown;
};

export const useCursorStyle = (
  definitions: Ref<SetDefinition[]>,
  surface: CanvasProps,
) => {
  const iseMouseDown = useMouseDown(surface);
  return computed(() => {
    const { x, y } = surface.cursorCoordinates.value;

    for (const setDefinition of definitions.value) {
      const { display } = setDefinition;

      if (isOnEdge(x, y, display)) {
        return getAngleBetweenTwoPoints(x, y, display.at.x, display.at.y) > 0.75
          ? CURSOR.NS_RESIZE
          : CURSOR.EW_RESIZE;
      }

      if (isInsideCircle(x, y, display)) {
        return iseMouseDown.value ? CURSOR.GRABBING : CURSOR.GRAB;
      }
    }
    return CURSOR.AUTO;
  });
};
