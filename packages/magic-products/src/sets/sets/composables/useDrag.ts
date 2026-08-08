import { CanvasProps } from '@canvas/surface/types';
import { Coordinate } from '@core/utils/canvas/index';
import { MOUSE_BUTTONS } from '@core/utils/mouse';

import { type UnwrapRef, computed, onBeforeUnmount, ref } from 'vue';

type ActiveDrag<T> = {
  startingCoords: Coordinate;
  item: T;
};

export const useDrag = <T>(
  surface: CanvasProps,
  getItem: (
    magicCanvasCoords: UnwrapRef<CanvasProps>['cursorCoordinates'],
  ) => T | undefined,
  setItemCoords: (item: T, diff: Coordinate) => void,
) => {
  const activeDrag = ref<ActiveDrag<T>>();

  const beginDrag = (ev: MouseEvent) => {
    if (ev.button !== MOUSE_BUTTONS.left) return;
    const item = getItem(surface.cursorCoordinates.value);
    if (!item) return;
    activeDrag.value = {
      item,
      startingCoords: surface.cursorCoordinates.value,
    };
  };

  const drag = () => {
    if (!activeDrag.value) return;
    const { startingCoords, item } = activeDrag.value;

    const dx = surface.cursorCoordinates.value.x - startingCoords.x;
    const dy = surface.cursorCoordinates.value.y - startingCoords.y;

    setItemCoords(item, { x: dx, y: dy });
    activeDrag.value.startingCoords = surface.cursorCoordinates.value;
  };

  const drop = () => {
    activeDrag.value = undefined;
  };

  document.addEventListener('mousedown', beginDrag);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', drop);

  onBeforeUnmount(() => {
    document.removeEventListener('mousedown', beginDrag);
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', drop);
  });

  return {
    activeDrag,
    isDragging: computed(() => !!activeDrag.value),
  };
};
