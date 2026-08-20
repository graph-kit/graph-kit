import { CanvasSurface } from '@canvas/surface/types';

import type { Ref } from 'vue';

import type { SetDefinition } from '../../types.ts';
import { isOnEdge } from '../other/circleUtils.ts';
import { MAX_CIRCLE_RADIUS, MIN_CIRCLE_RADIUS } from '../other/constants.ts';
import { useDrag } from './useDrag.ts';

type CircleResizeProps = {
  surface: CanvasSurface;
  definitions: Ref<SetDefinition[]>;
};

export const useCircleResize = ({
  surface,
  definitions,
}: CircleResizeProps) => {
  const { isDragging: isResizing } = useDrag(
    surface,
    (coords) =>
      definitions.value
        .toSorted((a, b) => a.display.radius - b.display.radius)
        .find(({ display }) => isOnEdge(coords.x, coords.y, display)),
    (definition) => {
      const coords = surface.cursorCoordinates.value;
      const { at } = definition.display;
      const dx = at.x - coords.x;
      const dy = at.y - coords.y;
      const distanceFromCenterToCursor = Math.hypot(dx, dy);
      definition.display.radius = Math.min(
        Math.max(distanceFromCenterToCursor, MIN_CIRCLE_RADIUS),
        MAX_CIRCLE_RADIUS,
      );
    },
  );

  return {
    isResizing,
  };
};
