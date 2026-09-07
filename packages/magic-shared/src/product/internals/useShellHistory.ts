import { ComputedRef, computed, ref, watch } from 'vue';

import { HistoryField, ShellHistory } from '../types.ts';

export type ShellHistoryOptions = {
  local: HistoryField | undefined;
  roomHistory: ComputedRef<HistoryField | undefined>;
  inRoom: () => boolean;
};

export const useShellHistory = ({
  local,
  roomHistory,
  inRoom,
}: ShellHistoryOptions): ShellHistory | undefined => {
  const inMultiplayerSession = computed(inRoom);

  const active = () => (inMultiplayerSession.value ? roomHistory.value : local);

  const disabled = ref<string>();

  watch(inMultiplayerSession, () => local?.clear());

  const disable = (reason: string) => {
    disabled.value = reason;

    let released = false;
    return () => {
      if (released) return;
      released = true;
      disabled.value = undefined;
    };
  };

  return (
    local && {
      canUndo: computed(
        () => !disabled.value && active()?.canUndo.value === true,
      ),
      canRedo: computed(
        () => !disabled.value && active()?.canRedo.value === true,
      ),
      undo: () => {
        if (disabled.value) return;
        active()?.undo();
      },
      redo: () => {
        if (disabled.value) return;
        active()?.redo();
      },
      clear: () => active()?.clear(),
      suppress: disable,
      disabled: computed(() => disabled.value),
    }
  );
};
