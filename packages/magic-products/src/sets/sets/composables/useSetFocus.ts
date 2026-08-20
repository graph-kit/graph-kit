import { circle } from '@canvas/primitives/shapes/circle/index';
import { CanvasSurface } from '@canvas/surface/types';

import { type Ref, computed, ref } from 'vue';

import type { SetDefinition, SetDefinitionId } from '../../types.ts';
import { isOnEdge } from '../other/circleUtils.ts';

type SetFocusProps = {
  definitions: Ref<SetDefinition[]>;
  surface: CanvasSurface;
};

/**
 * focus tracks which sets the next set-targeted action applies to, such as the
 * delete shortcut, and which circles draw with the focus outline
 */
export type SetFocusControls = {
  /** whether a set is focused, for drawing it differently */
  isFocused: (id: SetDefinitionId) => boolean;
  /** focuses a set on its own, dropping whatever was focused before */
  set: (id: SetDefinitionId) => void;
};

export const useSetFocus = ({
  definitions,
  surface,
}: SetFocusProps): SetFocusControls => {
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

  const focusSetAtCursor = () => {
    const definition = getDefinitionAtCursorPosition();
    if (!definition) return focusedSetIds.value.clear();
    setFocus(definition.id);
  };

  surface.events.canvas.subscribe('onMouseDown', focusSetAtCursor);

  return {
    isFocused: (id) => focusedSetIds.value.has(id),
    set: setFocus,
  };
};
