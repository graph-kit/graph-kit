import type { MagicCanvasProps } from "@/canvas/types"
import type { Coordinate } from "@/shapes/types/utility"
import { MOUSE_BUTTONS } from "@/utils/mouse"
import { computed, onBeforeUnmount, ref, type UnwrapRef } from "vue"

type ActiveDrag<T> = {
  startingCoords: Coordinate,
  item: T,
}

export const useDrag = <T>(
  magicCanvas: MagicCanvasProps,
  getItem: (magicCanvasCoords: UnwrapRef<MagicCanvasProps>['cursorCoordinates']) => T | undefined,
  setItemCoords: (item: T, diff: Coordinate) => void
) => {
  const activeDrag = ref<ActiveDrag<T>>()

  const beginDrag = (ev: MouseEvent) => {
    if (ev.button !== MOUSE_BUTTONS.left) return;
    const item = getItem(magicCanvas.cursorCoordinates.value)
    if (!item) return;
    activeDrag.value = {
      item,
      startingCoords: magicCanvas.cursorCoordinates.value,
    }
  }

  const drag = () => {
    if (!activeDrag.value) return;
    const { startingCoords, item } = activeDrag.value

    const dx = magicCanvas.cursorCoordinates.value.x - startingCoords.x;
    const dy = magicCanvas.cursorCoordinates.value.y - startingCoords.y;

    setItemCoords(item, { x: dx, y: dy })
    activeDrag.value.startingCoords = magicCanvas.cursorCoordinates.value;
  }

  const drop = () => {
    activeDrag.value = undefined;
  }

  document.addEventListener('mousedown', beginDrag)
  document.addEventListener('mousemove', drag)
  document.addEventListener('mouseup', drop)

  onBeforeUnmount(() => {
    document.removeEventListener('mousedown', beginDrag)
    document.removeEventListener('mousemove', drag)
    document.removeEventListener('mouseup', drop)
  })

  return {
    activeDrag,
    isDragging: computed(() => !!activeDrag.value)
  }
}