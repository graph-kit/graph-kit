import { ComputedRef, computed, ref } from 'vue';

import { ComponentSlot } from '../../component-slot/types.ts';
import { ComponentSlotControls } from '../../component-slot/useComponentSlotsState.ts';
import { toast } from '../toast/useToastState.ts';
import ShellDashboard from './ShellDashboard.vue';
import ShellFlags from './ShellFlags.vue';
import SurfaceDashboard from './SurfaceDashboard.vue';

const DEBUG_SLOT_PRIORITY = -Infinity;

const DEBUG_SLOTS: ComponentSlot[] = [
  {
    id: 'shell/debug/surface',
    component: SurfaceDashboard,
    position: 'bottom-right',
    priority: DEBUG_SLOT_PRIORITY,
  },
  /*
    the flags and the shell readouts sit opposite the surface one, since bottom right
    already carries the shell's own controls and three stacked panels outgrow it
  */
  {
    id: 'shell/debug/product-flags',
    component: ShellFlags,
    position: 'bottom-left',
    priority: DEBUG_SLOT_PRIORITY,
  },
  {
    id: 'shell/debug/shell',
    component: ShellDashboard,
    position: 'bottom-left',
    priority: DEBUG_SLOT_PRIORITY,
  },
];

const TOGGLE_TOAST_MS = 5000;

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
