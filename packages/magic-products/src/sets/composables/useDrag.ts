import type { ElementMouseEvent } from '@canvas/surface/events/index';
import type { CanvasSurface } from '@canvas/surface/types';
import { Coordinate } from '@core/utils/canvas/index';
import { MOUSE_BUTTONS } from '@core/utils/mouse';

import { computed, onBeforeUnmount, ref } from 'vue';

type ActiveDrag<Item> = {
  startingCoords: Coordinate;
  item: Item;
<<<<<<< Updated upstream
  /** true if pointer travelled since the press */
  moved: boolean;
=======
>>>>>>> Stashed changes
};

type DragOptions<Item> = {
  surface: CanvasSurface;
  /** what this drag is called by whatever has to take the pointer ahead of it */
  handlerId: string;
  /** what the press landed on, or undefined for a press this drag ignores */
  getItem: (event: ElementMouseEvent) => Item | undefined;
  /** `at` is where the cursor is now, `diff` how far it moved since the last frame */
  onMove: (item: Item, cursor: { at: Coordinate; diff: Coordinate }) => void;
<<<<<<< Updated upstream
  /** the gesture settled. skipped for a press that moved nothing */
  onDrop: (item: Item) => void;
=======
>>>>>>> Stashed changes
};

export const useDrag = <Item>({
  surface,
  handlerId,
  getItem,
  onMove,
}: DragOptions<Item>) => {
  const activeDrag = ref<ActiveDrag<Item>>();

  const beginDrag = (elementEvent: ElementMouseEvent) => {
    if (elementEvent.event.button !== MOUSE_BUTTONS.left) return;
    const item = getItem(elementEvent);
    if (item === undefined) return;
    // the press carries its own position, so a drag never depends on a mousemove preceding it
    activeDrag.value = { item, startingCoords: elementEvent.coords };
  };

  const drag = (event: MouseEvent) => {
    if (!activeDrag.value) return;
    const { startingCoords, item } = activeDrag.value;

    const at = surface.toWorldCoordinates(event);
    const diff = { x: at.x - startingCoords.x, y: at.y - startingCoords.y };

    onMove(item, { at, diff });
    activeDrag.value.startingCoords = at;
  };

  const drop = () => {
    activeDrag.value = undefined;
  };

  surface.events.elements.handle('onMouseDown', beginDrag, handlerId);
  surface.events.canvas.subscribe('onMouseMove', drag);
  surface.events.dom.subscribe('onMouseUp', drop);

  const cleanup = () => {
    surface.events.elements.unhandle('onMouseDown', beginDrag);
    surface.events.canvas.unsubscribe('onMouseMove', drag);
    surface.events.dom.unsubscribe('onMouseUp', drop);
  };

  onBeforeUnmount(cleanup);

  return {
    activeDrag,
    isDragging: computed(() => !!activeDrag.value),
  };
};
