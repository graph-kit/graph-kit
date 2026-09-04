import type { ElementMouseEvent } from '@canvas/surface/events/index';
import type { CanvasSurface } from '@canvas/surface/types';

import { onBeforeUnmount, ref } from 'vue';

import { setElementIdentity } from '../draw/elementIdentity.ts';
import type { SetDefinitionId } from '../types.ts';

type SetFocusProps = {
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

export const useSetFocus = ({ surface }: SetFocusProps): SetFocusControls => {
  const focusedSetIds = ref(new Set<SetDefinitionId>());

  const setFocus = (id: SetDefinitionId) => {
    focusedSetIds.value.clear();
    focusedSetIds.value.add(id);
  };

  // the edge counts as the set: grabbing a circle to resize it focuses it too
  const focusSetUnderCursor = ({ topElement }: ElementMouseEvent) => {
    const identity = setElementIdentity(topElement);
    if (!identity) return focusedSetIds.value.clear();
    setFocus(identity.setId);
  };

  surface.events.elements.subscribe('onMouseDown', focusSetUnderCursor);

  onBeforeUnmount(() =>
    surface.events.elements.unsubscribe('onMouseDown', focusSetUnderCursor),
  );

  return {
    isFocused: (id) => focusedSetIds.value.has(id),
    set: setFocus,
  };
};
