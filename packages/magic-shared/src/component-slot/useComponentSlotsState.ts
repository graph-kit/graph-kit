import { devWarning } from '@core/utils/debugging';

import { ComputedRef, computed, markRaw, ref, shallowRef } from 'vue';

import { ComponentSlot } from './types.ts';

export type ComponentSlotControls = {
  visibility: {
    isHidden: ComputedRef<boolean>;
    toggle: () => void;
  };
  entries: ComputedRef<ComponentSlot[]>;
  add: (slot: ComponentSlot) => void;
  addMany: (slots: ComponentSlot[]) => void;
  remove: (slotId: string) => void;
  setHighlighted: (slotId: string) => void;
  clearHighlighted: () => void;
  highlightedId: ComputedRef<string | undefined>;
};

export const useComponentSlotsState = (): ComponentSlotControls => {
  const isHidden = ref(false);
  const componentSlots = shallowRef<ComponentSlot[]>([]);
  const highlightedSlot = ref<ComponentSlot['id']>();

  const addMany = (slots: ComponentSlot[]) => {
    const newSlots = slots.map((slot) => ({
      ...slot,
      component: markRaw(slot.component),
    }));
    componentSlots.value = [...componentSlots.value, ...newSlots];
  };

  const clearHighlighted = () => (highlightedSlot.value = undefined);
  const setHighlighted = (slotId: ComponentSlot['id']) => {
    const validSlot = componentSlots.value.some((s) => s.id === slotId);
    if (!validSlot) {
      devWarning(`tried highlighting non-existent slot with ID ${slotId}`);
      return;
    }
    highlightedSlot.value = slotId;
  };

  const remove = (slotId: ComponentSlot['id']) => {
    if (slotId === highlightedSlot.value) clearHighlighted();
    componentSlots.value = componentSlots.value.filter(
      (slot) => slot.id !== slotId,
    );
  };

  return {
    entries: computed(() => componentSlots.value),
    add: (slot) => addMany([slot]),
    addMany,
    remove,
    setHighlighted,
    clearHighlighted,
    highlightedId: computed(() => highlightedSlot.value),
    visibility: {
      isHidden: computed(() => isHidden.value),
      toggle: () => (isHidden.value = !isHidden.value),
    },
  };
};
