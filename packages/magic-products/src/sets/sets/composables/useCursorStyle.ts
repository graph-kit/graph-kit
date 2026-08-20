import { CanvasSurface } from '@canvas/surface/types';
import { nullThrows } from '@core/utils/assert';
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

const useMouseDown = (surface: CanvasSurface) => {
  const isMouseDown = ref(false);

  const setMouseDown = () => (isMouseDown.value = true);
  const setMouseUp = () => (isMouseDown.value = false);

  surface.events.canvas.subscribe('onMouseDown', setMouseDown);
  surface.events.dom.subscribe('onMouseUp', setMouseUp);

  const cleanup = () => {
    surface.events.canvas.unsubscribe('onMouseDown', setMouseDown);
    surface.events.dom.unsubscribe('onMouseUp', setMouseUp);
  };

  onBeforeUnmount(cleanup);

  return isMouseDown;
};

/**
 * shapes the canvas cursor to whatever circle sits under it: a resize arrow on an
 * edge, grab inside, default everywhere else. writes to the canvas after each
 * repaint rather than handing back a value to apply.
 */
export const useCursorStyle = (
  definitions: Ref<SetDefinition[]>,
  surface: CanvasSurface,
) => {
  const iseMouseDown = useMouseDown(surface);
  const cursor = computed(() => {
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

  surface.events.lifecycle.subscribe('onAfterRepaint', () => {
    const canvas = nullThrows(surface.canvas.value, 'canvas not defined');
    if (canvas.style.cursor === cursor.value) return;
    canvas.style.cursor = cursor.value;
  });
};
