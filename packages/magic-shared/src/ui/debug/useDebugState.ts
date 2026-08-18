import { ComputedRef, computed, ref } from 'vue';

import { ComponentSlot } from '../../component-slot/types.ts';
import { ComponentSlotControls } from '../../component-slot/useComponentSlotsState.ts';
import CursorCoordinates from './CursorCoordinates.vue';

const DEBUG_SLOTS: ComponentSlot[] = [
  {
    id: 'product/debug/cursor-coordinates',
    component: CursorCoordinates,
    position: 'bottom-right',
  },
];

export type DebugControls = {
  isActive: ComputedRef<boolean>;
  activate: () => void;
  deactivate: () => void;
  toggle: () => void;
};

/** the dev mode debugging components, reachable in every product with the "d" key */
export const useDebugState = (
  componentSlots: ComponentSlotControls,
): DebugControls => {
  const isActive = ref(false);

  const activate = () => {
    if (isActive.value) return;
    isActive.value = true;
    componentSlots.addMany(DEBUG_SLOTS);
  };

  const deactivate = () => {
    if (!isActive.value) return;
    isActive.value = false;
    for (const slot of DEBUG_SLOTS) componentSlots.remove(slot.id);
  };

  // TODO toast on toggle telling the user debug is on and that "d" turns it back off
  const toggle = () => {
    if (isActive.value) deactivate();
    else activate();
  };

  return {
    isActive: computed(() => isActive.value),
    activate,
    deactivate,
    toggle,
  };
};
