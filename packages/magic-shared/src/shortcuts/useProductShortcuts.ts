import { useFullscreen } from '@vueuse/core';

import { Magic } from '../product/types.ts';
import { ShortcutItem } from './useShortcuts.ts';

export const useProductShortcuts = (magic: Magic) => {
  const fullscreen = useFullscreen();
  // TODO make it windows + mac agnostic
  const shortcuts: ShortcutItem[] = [
    {
      id: 'product/fullscreen',
      key: 'f',
      callback: fullscreen.toggle,
    },
    {
      id: 'product/toggle-component-slot-ui',
      key: 'meta+.',
      callback: magic.componentSlots.visibility.toggle,
    },
    {
      id: 'product/undo',
      key: 'meta+z',
      callback: () => {
        if (!magic.history?.canUndo.value) return;
        magic.history.undo();
      },
    },
    {
      id: 'product/redo',
      key: 'meta+shift+z',
      callback: () => {
        if (!magic.history?.canRedo.value) return;
        magic.history.redo();
      },
    },
  ];

  for (const shortcut of shortcuts) {
    magic.shortcuts.add(shortcut);
  }
};
