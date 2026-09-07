import { isMac } from '@core/utils/keyboard';

import { ComputedRef, computed, ref } from 'vue';

import { ComponentSlot } from '../../component-slot/types.ts';
import { ComponentSlotControls } from '../../component-slot/useComponentSlotsState.ts';
import { toast } from '../toast/useToastState.ts';
import BugReport from './BugReport.vue';
import ShellDashboard from './ShellDashboard.vue';
import ShellFlags from './ShellFlags.vue';
import SurfaceDashboard from './SurfaceDashboard.vue';
import UserAgent from './UserAgent.vue';

const DEBUG_SLOT_PRIORITY = -Infinity;

const DEBUG_SLOTS: ComponentSlot[] = [
  // first in its corner, so the way to report a bug sits above what it reports
  {
    id: 'shell/debug/bug-report',
    component: BugReport,
    position: 'bottom-right',
    priority: DEBUG_SLOT_PRIORITY,
  },
  {
    id: 'shell/debug/user-agent',
    component: UserAgent,
    position: 'bottom-right',
    priority: DEBUG_SLOT_PRIORITY,
  },
  {
    id: 'shell/debug/surface',
    component: SurfaceDashboard,
    position: 'bottom-right',
    priority: DEBUG_SLOT_PRIORITY,
  },
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
      title: isActive.value ? 'Debug On' : 'Debug Off',
      description: 'Toggle with ' + (isMac() ? '⌘ Command + D' : 'Ctrl + D'),
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
