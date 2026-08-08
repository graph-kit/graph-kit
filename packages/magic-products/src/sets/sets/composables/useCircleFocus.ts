import { computed, onBeforeUnmount, ref, type Ref } from "vue"
import type { Circle } from "../types/types"
import type { MagicCanvasProps } from "@/canvas/types"
import { circle } from "@/shapes/shapes/circle"
import { isOnEdge } from "../other/circleUtils"

type CircleFocusProps = {
  circles: Ref<Circle[]>,
  magicCanvas: MagicCanvasProps,
}

export const useCircleFocus = ({
  circles,
  magicCanvas,
}: CircleFocusProps) => {
  const focusedCircleLabels = ref(new Set<Circle['label']>())

  const sortedCircles = computed(() => {
    return circles.value.toSorted((a, b) => a.radius - b.radius)
  })

  const setFocus = (label: Circle['label']) => {
    focusedCircleLabels.value.clear()
    focusedCircleLabels.value.add(label)
  }

  const getCircleAtCursorPosition = () => {
    const coord = magicCanvas.cursorCoordinates.value;
    return sortedCircles.value.find((c) => {
      const inCircle = circle(c).hitbox(coord)
      // this accounts for the special buffer region thats not part of the shape but only
      // for targeting circle
      const onCircleEdge = isOnEdge(coord.x, coord.y, c)
      return inCircle || onCircleEdge
    })
  }

  const focusCircle = () => {
    const circle = getCircleAtCursorPosition()
    if (!circle) return focusedCircleLabels.value.clear();
    setFocus(circle.label)
  }

  document.addEventListener('mousedown', focusCircle)

  onBeforeUnmount(() => {
    document.removeEventListener('mousedown', focusCircle)
  })

  return {
    focusedCircleIds: focusedCircleLabels,
    isCircleFocused: (label: Circle['label']) => focusedCircleLabels.value.has(label),
    setFocus,
  }
}

export type CircleFocusControls = ReturnType<typeof useCircleFocus>