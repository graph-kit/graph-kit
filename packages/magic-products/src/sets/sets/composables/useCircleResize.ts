import { CanvasProps } from '@canvas/surface/types';

import type { Ref } from 'vue';

import { isOnEdge } from '../other/circleUtils.ts';
import type { Circle } from '../types/types.ts';
import { useDrag } from './useDrag.ts';

type CircleResizeProps = {
  surface: CanvasProps;
  circles: Ref<Circle[]>;
};

export const useCircleResize = ({ surface, circles }: CircleResizeProps) => {
  const { isDragging: isResizing } = useDrag(
    surface,
    (coords) =>
      circles.value
        .toSorted((a, b) => a.radius - b.radius)
        .find((c) => isOnEdge(coords.x, coords.y, c)),
    (circle) => {
      const coords = surface.cursorCoordinates.value;
      const dx = circle.at.x - coords.x;
      const dy = circle.at.y - coords.y;
      const distanceFromCenterToCursor = Math.hypot(dx, dy);
      circle.radius = distanceFromCenterToCursor;
    },
  );

  return {
    isResizing,
  };
};
