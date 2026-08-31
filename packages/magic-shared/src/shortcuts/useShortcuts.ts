import { devWarning } from '@core/utils/debugging';
import { PartiallyPartial } from '@core/utils/types';
import { Callback, Key } from 'ctrl-keys';

import { ComputedRef, computed, onUnmounted, ref } from 'vue';

import { WithHelpMenuEntry } from '../ui/help-menu/types.ts';
import { useCtrlKeys } from './useCtrlKeys.ts';

export type ShortcutItem = WithHelpMenuEntry & {
  id: string;
  key: Key;
  callback: Callback;
};

export type ShortcutControls = {
  shortcuts: ComputedRef<ShortcutItem[]>;
  add: (shortcut: ShortcutItem) => void;
  remove: (id: ShortcutItem['id']) => void;
  useShortcut: (shortcut: PartiallyPartial<ShortcutItem, 'id'>) => () => void;
};

export const useShortcuts = (): ShortcutControls => {
  const ctrlKeys = useCtrlKeys();
  const shortcuts = ref<ShortcutItem[]>([]);

  const add: ShortcutControls['add'] = (shortcut) => {
    const idExists = shortcuts.value.some((s) => s.id === shortcut.id);
    if (idExists) {
      devWarning(
        'Prevented shortcut with duplicate ID from being added',
        shortcut,
      );
      return;
    }
    shortcuts.value.push(shortcut);
    ctrlKeys.add(shortcut.key, shortcut.callback);
  };

  const remove: ShortcutControls['remove'] = (id) => {
    const shortcut = shortcuts.value.find((s) => s.id === id);
    if (!shortcut) return;
    shortcuts.value = shortcuts.value.filter((s) => s.id !== id);
    ctrlKeys.remove(shortcut.key, shortcut.callback);
  };

  const useShortcut: ShortcutControls['useShortcut'] = ({
    key,
    callback,
    id = crypto.randomUUID(),
  }) => {
    add({ key, callback, id });
    const remover = () => remove(id);
    onUnmounted(remover);
    return remover;
  };

  return {
    shortcuts: computed(() => shortcuts.value),
    useShortcut,
    add,
    remove,
  };
};
