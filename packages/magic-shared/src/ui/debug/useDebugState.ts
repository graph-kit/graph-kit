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
  {
    id: 'shell/debug/bug-report',
    component: BugReport,
    position: 'top-middle',
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

const TOAST_MS = {
  on: 5000,
  off: 2000,
} as const;

export type DebugControls = {
  isActive: ComputedRef<boolean>;
  activate: () => void;
  deactivate: () => void;
  toggle: () => void;
};

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
      duration: isActive.value ? TOAST_MS.on : TOAST_MS.off,
    });
  };

  return {
    isActive: computed(() => isActive.value),
    activate,
    deactivate,
    toggle,
  };
};
