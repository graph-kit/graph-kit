import { computed, watch } from 'vue';

import { HistoryField, MagicProductHost } from '../types.ts';
import { ProductHostBinding } from './useHostBinding.ts';

export type ProductHistoryOptions = {
  host: MagicProductHost;
  binding: ProductHostBinding['binding'];
  /**
   * read lazily rather than passed as state: the room this answers for is reached
   * through the binding above, so it does not exist yet at construction
   */
  inRoom: () => boolean;
};

/**
 * One history API for consumers. A multiplayer session swaps in the host's document
 * scoped undo, since replaying whole local states over a session would take a peer's
 * work with it.
 */
export const useProductHistory = ({
  host,
  binding,
  inRoom,
}: ProductHistoryOptions): HistoryField | undefined => {
  const sharing = computed(inRoom);

  const active = () => (sharing.value ? binding.value?.history : host.history);

  // joining and leaving each make what is on screen a new starting point, the same way
  // a restore does
  watch(sharing, () => host.history?.clear());

  return (
    host.history && {
      canUndo: computed(() => active()?.canUndo.value === true),
      canRedo: computed(() => active()?.canRedo.value === true),
      undo: () => active()?.undo(),
      redo: () => active()?.redo(),
      clear: () => active()?.clear(),
    }
  );
};
