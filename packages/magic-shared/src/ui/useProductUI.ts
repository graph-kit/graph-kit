import { ComponentSlot } from '../component-slot/types.ts';
import { ComponentSlotControls } from '../component-slot/useComponentSlotsState.ts';
import BottomRightControls from './bottom-right-controls/BottomRightControls.vue';
import CursorCoordinates from './debug/CursorCoordinates.vue';
import NavigationMenu from './navigation-menu/NavigationMenu.vue';

export type UIOptions = {
  debug?: boolean;
  linkSharing?: boolean;
};

export type UIControls = {
  linkSharing: boolean;
};

export const useProductUI = (
  componentSlots: ComponentSlotControls,
  options: UIOptions = {},
): UIControls => {
  const slots: (ComponentSlot | undefined)[] = [
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
    options.debug
      ? {
          id: 'product/debug/cursor-coordinates',
          component: CursorCoordinates,
          position: 'bottom-right',
        }
      : undefined,
  ];

  const definedSlots = slots.filter((s) => !!s);
  componentSlots.addMany(definedSlots);

  return {
    linkSharing: options.linkSharing !== false,
  };
};
