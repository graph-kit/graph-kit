import { circle } from '@canvas/primitives/shapes/circle/index';
import { CanvasProps } from '@canvas/surface/types';

import { type Ref, computed, onBeforeUnmount, ref } from 'vue';

import { isOnEdge } from '../other/circleUtils.ts';
import type { Circle } from '../types/types.ts';

type CircleFocusProps = {
  circles: Ref<Circle[]>;
  surface: CanvasProps;
};

export const useCircleFocus = ({ circles, surface }: CircleFocusProps) => {
  const focusedCircleLabels = ref(new Set<Circle['label']>());

  const sortedCircles = computed(() => {
    return circles.value.toSorted((a, b) => a.radius - b.radius);
  });

  const setFocus = (label: Circle['label']) => {
    focusedCircleLabels.value.clear();
    focusedCircleLabels.value.add(label);
  };

  const getCircleAtCursorPosition = () => {
    const coord = surface.cursorCoordinates.value;
    return sortedCircles.value.find((c) => {
      const inCircle = circle(c).hitbox(coord);
      // this accounts for the special buffer region thats not part of the shape but only
      // for targeting circle
      const onCircleEdge = isOnEdge(coord.x, coord.y, c);
      return inCircle || onCircleEdge;
    });
  };

  const focusCircle = () => {
    const circle = getCircleAtCursorPosition();
    if (!circle) return focusedCircleLabels.value.clear();
    setFocus(circle.label);
  };

  document.addEventListener('mousedown', focusCircle);

  onBeforeUnmount(() => {
    document.removeEventListener('mousedown', focusCircle);
  });

  return {
    focusedCircleIds: focusedCircleLabels,
    isCircleFocused: (label: Circle['label']) =>
      focusedCircleLabels.value.has(label),
    setFocus,
  };
};

export type CircleFocusControls = ReturnType<typeof useCircleFocus>;
