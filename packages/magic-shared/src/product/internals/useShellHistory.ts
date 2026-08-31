import { ComputedRef, computed, ref, watch } from 'vue';

import { HistoryField, ShellHistory } from '../types.ts';

export type ProductHistoryOptions = {
  /** the product's own, which covers all of its state and none of anyone else's */
  local: HistoryField | undefined;
  roomHistory: ComputedRef<HistoryField | undefined>;
  inRoom: () => boolean;
};

/**
 * One history API for consumers. A multiplayer session swaps in the room's document
 * scoped undo, since replaying whole local states over a session would take a peer's
 * work with it.
 */
export const useShellHistory = ({
  local,
  roomHistory,
  inRoom,
}: ProductHistoryOptions): ShellHistory | undefined => {
  const sharing = computed(inRoom);

  const active = () => (sharing.value ? roomHistory.value : local);

  const suppression = ref<string>();

  // joining and leaving each make what is on screen a new starting point, the same way
  // a restore does
  watch(sharing, () => local?.clear());

  const suppress = (message: string) => {
    suppression.value = message;

    let released = false;
    return () => {
      if (released) return;
      released = true;
      suppression.value = undefined;
    };
  };

  return (
    local && {
      canUndo: computed(
        () => !suppression.value && active()?.canUndo.value === true,
      ),
      canRedo: computed(
        () => !suppression.value && active()?.canRedo.value === true,
      ),
      undo: () => {
        if (suppression.value) return;
        active()?.undo();
      },
      redo: () => {
        if (suppression.value) return;
        active()?.redo();
      },
      clear: () => active()?.clear(),
      suppress,
      suppression: computed(() => suppression.value),
    }
  );
};
