import { ComputedRef, computed, ref } from 'vue';

import { ComponentSlot } from '../../component-slot/types.ts';
import { ComponentSlotControls } from '../../component-slot/useComponentSlotsState.ts';
import { toast } from '../toast/useToastState.ts';
import CursorCoordinates from './CursorCoordinates.vue';

const DEBUG_SLOTS: ComponentSlot[] = [
  {
    id: 'product/debug/cursor-coordinates',
    component: CursorCoordinates,
    position: 'bottom-right',
  },
];

const TOGGLE_TOAST_MS = 3000;

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

  const toggle = () => {
    if (isActive.value) deactivate();
    else activate();

    toast.show({
      title: isActive.value ? 'Debug Mode On' : 'Debug Mode Off',
      description: isActive.value
        ? 'Press d to turn it back off.'
        : 'Press d to turn it back on.',
      severity: 'info',
      duration: TOGGLE_TOAST_MS,
    });
  };

  return {
    isActive: computed(() => isActive.value),
    activate,
    deactivate,
    toggle,
  };
};
