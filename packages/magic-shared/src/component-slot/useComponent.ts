import { ComputedRef, computed } from 'vue';

import { ComponentSlot } from './types.ts';
import { ComponentSlotControls } from './useComponentSlotsState.ts';

export type ComponentControls = {
  show: () => void;
  hide: () => void;
  setHighlight: (value: boolean) => void;
  isShown: ComputedRef<boolean>;
};

export const useComponent = (
  componentSlots: ComponentSlotControls,
  slot: ComponentSlot,
): ComponentControls => {
  const isShown = computed(() =>
    componentSlots.entries.value.some(({ id }) => id === slot.id),
  );

  return {
    show: () => componentSlots.add(slot),
    hide: () => componentSlots.remove(slot.id),
    isShown,
    setHighlight: (value) => {
      if (!isShown.value) return;
      componentSlots.clearHighlighted();
      if (value) componentSlots.setHighlighted(slot.id);
    },
  };
};
