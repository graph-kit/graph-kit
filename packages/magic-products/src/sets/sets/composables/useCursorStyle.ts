import { CanvasProps } from '@canvas/surface/types';

import { type Ref, computed, onBeforeUnmount, onMounted, ref } from 'vue';

import type { SetDefinition } from '../../types.ts';
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
  definitions: Ref<SetDefinition[]>,
  cursorCoords: CanvasProps['cursorCoordinates'],
) => {
  const isPointerDown = usePointerDown();
  return computed<CursorStyle>(() => {
    const { x, y } = cursorCoords.value;
    for (let i = definitions.value.length - 1; i >= 0; i--) {
      const { display } = definitions.value[i];
      if (isOnEdge(x, y, display))
        return getAngleBetweenTwoPoints(x, y, display.at.x, display.at.y) > 0.75
          ? 'ns-resize'
          : 'ew-resize';
      if (isInsideCircle(x, y, display))
        return isPointerDown.value ? 'grabbing' : 'grab';
    }
    return 'auto';
  });
};
