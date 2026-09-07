import { ComponentSlot } from '../component-slot/types.ts';
import { ComponentSlotControls } from '../component-slot/useComponentSlotsState.ts';
import { ShellFlags } from '../product/flags.ts';
import BottomLeftControls from './bottom-left-controls/BottomLeftControls.vue';
import BottomRightControls from './bottom-right-controls/BottomRightControls.vue';
import NavigationMenu from './navigation-menu/NavigationMenu.vue';

export const useShellUI = (
  componentSlots: ComponentSlotControls,
  flags: ShellFlags,
) => {
  const slots: ComponentSlot[] = [
    {
      id: 'shell/bottom-left-controls',
      component: BottomLeftControls,
      position: 'bottom-left',
    },
    {
      id: 'shell/bottom-right-controls',
      component: BottomRightControls,
      position: 'bottom-right',
    },
  ];

  if (flags.navigation)
    slots.push({
      id: 'shell/navigation-menu',
      component: NavigationMenu,
      position: 'top-left',
    });

  componentSlots.addMany(slots);
};
