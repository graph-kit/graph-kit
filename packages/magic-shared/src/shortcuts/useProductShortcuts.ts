import { useFullscreen } from '@vueuse/core';

import { Magic } from '../product/types.ts';
import { ShortcutItem } from './useShortcuts.ts';

export const useProductShortcuts = (magic: Magic) => {
  const fullscreen = useFullscreen();
  // TODO make it windows + mac agnostic
  const shortcuts: (ShortcutItem | undefined)[] = [
    {
      id: 'product/fullscreen',
      key: 'f',
      callback: fullscreen.toggle,
    },
    magic.annotations
      ? {
          id: 'product/toggle-annotations',
          key: 'a',
          callback: magic.annotations.toggle,
        }
      : undefined,
    {
      id: 'product/toggle-debug',
      key: 'd',
      callback: magic.debug.toggle,
    },
    {
      id: 'product/toggle-component-slot-ui',
      key: 'meta+.',
      callback: magic.componentSlots.visibility.toggle,
    },
    {
      id: 'product/zoom-out',
      key: '-',
      callback: () => magic.surface.camera.actions.zoomOut(),
    },
    // the key carries shift on the layouts that print + above =, so the shifted
    // binding is the literal press and the bare one is the same key without it
    {
      id: 'product/zoom-in',
      key: 'shift++',
      callback: () => magic.surface.camera.actions.zoomIn(),
    },
    {
      id: 'product/zoom-in-unshifted',
      key: '=',
      callback: () => magic.surface.camera.actions.zoomIn(),
    },
    magic.history
      ? {
          id: 'product/undo',
          key: 'meta+z',
          callback: () => {
            if (!magic.history?.canUndo.value) return;
            magic.history.undo();
          },
        }
      : undefined,
    magic.history
      ? {
          id: 'product/redo',
          key: 'meta+shift+z',
          callback: () => {
            if (!magic.history?.canRedo.value) return;
            magic.history.redo();
          },
        }
      : undefined,
  ];

  for (const shortcut of shortcuts) {
    if (!shortcut) continue;
    magic.shortcuts.add(shortcut);
  }
};
