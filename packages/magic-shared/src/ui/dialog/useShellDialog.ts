import { computed, ref } from 'vue';

import { DialogControls, DialogEntry, DialogOptions } from './types.ts';

const entry = ref<DialogEntry>();

const open: DialogControls['open'] = (options: DialogOptions) => {
  const id = crypto.randomUUID();
  entry.value = { ...options, id };
  return id;
};

const close: DialogControls['close'] = (id) => {
  if (entry.value?.id !== id) return;
  entry.value = undefined;
};

const dialog: DialogControls = {
  entry: computed(() => entry.value),
  open,
  close,
};

export const useShellDialog = (): DialogControls => dialog;

export { dialog };
