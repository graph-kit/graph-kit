import type { CanvasSurface } from '@canvas/surface/types';

import type { Ref } from 'vue';

import { MAX_CIRCLE_RADIUS, MIN_CIRCLE_RADIUS } from '../constants.ts';
import { setElementIdentity } from '../draw/elementIdentity.ts';
import type { SetDefinition } from '../types.ts';
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
    ({ topElement }) => {
      const identity = setElementIdentity(topElement);
      if (identity?.part !== 'edge') return;
      return definitions.value.find(({ id }) => id === identity.setId);
    },
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
