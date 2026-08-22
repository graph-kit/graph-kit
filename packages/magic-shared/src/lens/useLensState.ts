import { ComputedRef, computed, shallowRef, watch } from 'vue';

import { ComponentSlotControls } from '../component-slot/useComponentSlotsState.ts';
import type { Lens } from './types.ts';

export type LensControls = {
  add: (lens: Lens) => void;
  remove: (id: string) => void;
  activeId: ComputedRef<string | undefined>;
};

const LENS_COMPONENT_ID_PREFIX = (lensId: string) => `lens/${lensId}`;

export const useLensState = (
  componentSlots: ComponentSlotControls,
): LensControls => {
  const lenses = shallowRef<Lens[]>([]);

  const removeLens = (id: Lens['id']) => {
    lenses.value = lenses.value.filter((l) => l.id !== id);
  };

  const addLens = (lens: Lens) => {
    removeLens(lens.id);
    lenses.value = [...lenses.value, lens];
  };

  const activeLens = computed(() => lenses.value.at(-1));

  watch(activeLens, (newLens, oldLens) => {
    if (oldLens) {
      oldLens.deactivate?.();

      // cleans up lens defined component slots with explicit IDs provided
      const oldLensComponentIds = (
        oldLens.components?.map((c) => c?.id) ?? []
      ).filter((id) => typeof id === 'string');

      const slotsBelongingToLens = componentSlots.entries.value.filter(
        (slots) =>
          slots.id.startsWith(LENS_COMPONENT_ID_PREFIX(oldLens.id)) ||
          oldLensComponentIds.includes(slots.id),
      );

      for (const slot of slotsBelongingToLens) {
        componentSlots.remove(slot.id);
      }
    }
    if (newLens) {
      newLens.activate?.();
      const components = newLens.components;
      if (components) {
        const lensComponentSlots = components.map((component, i) => ({
          ...component,
          // assign explicitly defined ID to component slot if provided,
          // otherwise default to lens provided default component ID
          id:
            component?.id ??
            `${LENS_COMPONENT_ID_PREFIX(newLens.id)}/slot-${i}`,
        }));
        componentSlots.addMany(lensComponentSlots);
      }
    }
  });

  return {
    add: addLens,
    remove: removeLens,
    activeId: computed(() => activeLens.value?.id),
  };
};
