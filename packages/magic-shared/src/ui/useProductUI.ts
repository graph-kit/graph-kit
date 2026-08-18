import { ComponentSlot } from '../component-slot/types.ts';
import { ComponentSlotControls } from '../component-slot/useComponentSlotsState.ts';
import { ProductFlags } from '../product/flags.ts';
import BottomLeftControls from './bottom-left-controls/BottomLeftControls.vue';
import BottomRightControls from './bottom-right-controls/BottomRightControls.vue';
import CursorCoordinates from './debug/CursorCoordinates.vue';
import NavigationMenu from './navigation-menu/NavigationMenu.vue';

export const useProductUI = (
  componentSlots: ComponentSlotControls,
  flags: ProductFlags,
) => {
  const slots: (ComponentSlot | undefined)[] = [
    {
      id: 'product/bottom-left-controls',
      component: BottomLeftControls,
      position: 'bottom-left',
    },
    {
      id: 'product/bottom-right-controls',
      component: BottomRightControls,
      position: 'bottom-right',
    },
    {
      id: 'product/navigation-menu',
      component: NavigationMenu,
      position: 'top-left',
    },
    flags.debug
      ? {
          id: 'product/debug/cursor-coordinates',
          component: CursorCoordinates,
          position: 'bottom-right',
        }
      : undefined,
  ];

  const definedSlots = slots.filter((s) => !!s);
  componentSlots.addMany(definedSlots);
};
