import { ComputedRef, computed, watch } from 'vue';

import { HistoryField } from '../types.ts';

export type ProductHistoryOptions = {
  /** the host's own, which covers all of its state and none of anyone else's */
  local: HistoryField | undefined;
  roomHistory: ComputedRef<HistoryField | undefined>;
  inRoom: () => boolean;
};

/**
 * One history API for consumers. A multiplayer session swaps in the room's document
 * scoped undo, since replaying whole local states over a session would take a peer's
 * work with it.
 */
export const useProductHistory = ({
  local,
  roomHistory,
  inRoom,
}: ProductHistoryOptions): HistoryField | undefined => {
  const sharing = computed(inRoom);

  const active = () => (sharing.value ? roomHistory.value : local);

  // joining and leaving each make what is on screen a new starting point, the same way
  // a restore does
  watch(sharing, () => local?.clear());

  return (
    local && {
      canUndo: computed(() => active()?.canUndo.value === true),
      canRedo: computed(() => active()?.canRedo.value === true),
      undo: () => active()?.undo(),
      redo: () => active()?.redo(),
      clear: () => active()?.clear(),
    }
  );
};
