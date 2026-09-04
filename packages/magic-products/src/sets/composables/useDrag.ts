import type { ElementMouseEvent } from '@canvas/surface/events/index';
import type { CanvasSurface } from '@canvas/surface/types';
import { Coordinate } from '@core/utils/canvas/index';
import { MOUSE_BUTTONS } from '@core/utils/mouse';

import { computed, onBeforeUnmount, ref } from 'vue';

type ActiveDrag<Item> = {
  startingCoords: Coordinate;
  item: Item;
};

export const useDrag = <Item>(
  surface: CanvasSurface,
  /** what the press landed on, or undefined for a press this drag ignores */
  getItem: (event: ElementMouseEvent) => Item | undefined,
  setItemCoords: (item: Item, diff: Coordinate) => void,
) => {
  const activeDrag = ref<ActiveDrag<Item>>();

  const beginDrag = (elementEvent: ElementMouseEvent) => {
    if (elementEvent.event.button !== MOUSE_BUTTONS.left) return;
    const item = getItem(elementEvent);
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

  surface.events.elements.subscribe('onMouseDown', beginDrag);
  surface.events.canvas.subscribe('onMouseMove', drag);
  surface.events.dom.subscribe('onMouseUp', drop);

  const cleanup = () => {
    surface.events.elements.unsubscribe('onMouseDown', beginDrag);
    surface.events.canvas.unsubscribe('onMouseMove', drag);
    surface.events.dom.unsubscribe('onMouseUp', drop);
  };

  onBeforeUnmount(cleanup);

  return {
    activeDrag,
    isDragging: computed(() => !!activeDrag.value),
  };
};
