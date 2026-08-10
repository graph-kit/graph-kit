import { circle } from '@canvas/primitives/shapes/circle/index';
import { CanvasProps } from '@canvas/surface/types';

import { type Ref, computed, ref } from 'vue';

import type { SetDefinition, SetDefinitionId } from '../../types.ts';
import { isOnEdge } from '../other/circleUtils.ts';

type CircleFocusProps = {
  definitions: Ref<SetDefinition[]>;
  surface: CanvasProps;
};

export const useCircleFocus = ({ definitions, surface }: CircleFocusProps) => {
  const focusedSetIds = ref(new Set<SetDefinitionId>());

  const sortedDefinitions = computed(() => {
    return definitions.value.toSorted(
      (a, b) => a.display.radius - b.display.radius,
    );
  });

  const setFocus = (id: SetDefinitionId) => {
    focusedSetIds.value.clear();
    focusedSetIds.value.add(id);
  };

  const getDefinitionAtCursorPosition = () => {
    const coord = surface.cursorCoordinates.value;
    return sortedDefinitions.value.find(({ display }) => {
      const inCircle = circle(display).hitbox(coord);
      // this accounts for the special buffer region thats not part of the shape but only
      // for targeting circle
      const onCircleEdge = isOnEdge(coord.x, coord.y, display);
      return inCircle || onCircleEdge;
    });
  };

  const focusCircle = () => {
    const definition = getDefinitionAtCursorPosition();
    if (!definition) return focusedSetIds.value.clear();
    setFocus(definition.id);
  };

  surface.domEvents.subscribe('onMouseDown', focusCircle);

  return {
    focusedSetIds,
    isFocused: (id: SetDefinitionId) => focusedSetIds.value.has(id),
    setFocus,
  };
};

export type CircleFocusControls = ReturnType<typeof useCircleFocus>;
