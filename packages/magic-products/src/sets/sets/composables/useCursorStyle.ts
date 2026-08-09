import { CanvasProps } from '@canvas/surface/types';

import { type Ref, computed, onBeforeUnmount, onMounted, ref } from 'vue';

import type { Circle } from '../../types.ts';
import { isInsideCircle, isOnEdge } from '../other/circleUtils.ts';

export type CursorStyle =
  'auto' | 'grab' | 'grabbing' | 'ew-resize' | 'ns-resize';

const getAngleBetweenTwoPoints = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) => {
  return Math.atan2(Math.abs(y1 - y2), Math.abs(x1 - x2));
};

const usePointerDown = () => {
  const isPointerDown = ref(false);

  const setPointerDown = () => (isPointerDown.value = true);
  const setPointerUp = () => (isPointerDown.value = false);

  onMounted(() => {
    document.addEventListener('pointerdown', setPointerDown);
    document.addEventListener('pointerup', setPointerUp);
    document.addEventListener('pointercancel', setPointerUp);
  });

  onBeforeUnmount(() => {
    document.removeEventListener('pointerdown', setPointerDown);
    document.removeEventListener('pointerup', setPointerUp);
    document.removeEventListener('pointercancel', setPointerUp);
  });

  return isPointerDown;
};

export const useCursorStyle = (
  circles: Ref<Circle[]>,
  cursorCoords: CanvasProps['cursorCoordinates'],
) => {
  const isPointerDown = usePointerDown();
  return computed<CursorStyle>(() => {
    const { x, y } = cursorCoords.value;
    for (let i = circles.value.length - 1; i >= 0; i--) {
      if (isOnEdge(x, y, circles.value[i]))
        return getAngleBetweenTwoPoints(
          x,
          y,
          circles.value[i].at.x,
          circles.value[i].at.y,
        ) > 0.75
          ? 'ns-resize'
          : 'ew-resize';
      if (isInsideCircle(x, y, circles.value[i]))
        return isPointerDown.value ? 'grabbing' : 'grab';
    }
    return 'auto';
  });
};
