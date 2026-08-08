import type { MagicCanvasProps } from "@/canvas/types";
import type { Circle } from "../types/types";
import type { Ref } from "vue";
import { useDrag } from "./useDrag";
import { isOnEdge } from "../other/circleUtils";

type CircleResizeProps = {
  magicCanvas: MagicCanvasProps,
  circles: Ref<Circle[]>
}

export const useCircleResize = ({
  magicCanvas,
  circles,
}: CircleResizeProps) => {
  const { isDragging: isResizing } = useDrag(
    magicCanvas,
    (coords) => circles.value.toSorted((a, b) => a.radius - b.radius).find((c) => isOnEdge(
      coords.x,
      coords.y,
      c,
    )),
    (circle) => {
      const coords = magicCanvas.cursorCoordinates.value
      const dx = circle.at.x - coords.x;
      const dy = circle.at.y - coords.y;
      const distanceFromCenterToCursor = Math.hypot(dx, dy)
      circle.radius = distanceFromCenterToCursor;
    }
  )

  return {
    isResizing
  }
}