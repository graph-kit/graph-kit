import { ComponentSlot } from '../component-slot/types.ts';
import { ComponentSlotControls } from '../component-slot/useComponentSlotsState.ts';
import BottomLeftControls from './bottom-left-controls/BottomLeftControls.vue';
import BottomRightControls from './bottom-right-controls/BottomRightControls.vue';
import NavigationMenu from './navigation-menu/NavigationMenu.vue';

export const useShellUI = (componentSlots: ComponentSlotControls) => {
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
    {
      id: 'shell/navigation-menu',
      component: NavigationMenu,
      position: 'top-left',
    },
  ];

  componentSlots.addMany(slots);
};
