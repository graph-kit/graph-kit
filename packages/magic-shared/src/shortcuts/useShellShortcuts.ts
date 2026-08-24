import { useFullscreen } from '@vueuse/core';

import { Shell } from '../product/types.ts';
import { ShortcutItem } from './useShortcuts.ts';

export const useShellShortcuts = (shell: Shell) => {
  const fullscreen = useFullscreen();
  // TODO make it windows + mac agnostic
  const shortcuts: (ShortcutItem | undefined)[] = [
    {
      id: 'shell/fullscreen',
      key: 'f',
      callback: fullscreen.toggle,
    },
    shell.annotations
      ? {
          id: 'shell/toggle-annotations',
          key: 'a',
          callback: () => {
            if (shell.multiplayer?.room.isReadonly.value) return;
            shell.annotations?.toggle();
          },
        }
      : undefined,
    {
      id: 'shell/toggle-debug',
      key: 'd',
      callback: shell.debug.toggle,
    },
    {
      id: 'shell/toggle-component-slot-ui',
      key: 'meta+.',
      callback: shell.componentSlots.visibility.toggle,
    },
    {
      id: 'shell/zoom-out',
      key: '-',
      callback: () => shell.surface.camera.actions.zoomOut(),
    },
    // the key carries shift on the layouts that print + above =, so the shifted
    // binding is the literal press and the bare one is the same key without it
    {
      id: 'shell/zoom-in',
      key: 'shift++',
      callback: () => shell.surface.camera.actions.zoomIn(),
    },
    {
      id: 'shell/zoom-in-unshifted',
      key: '=',
      callback: () => shell.surface.camera.actions.zoomIn(),
    },
    shell.history
      ? {
          id: 'shell/undo',
          key: 'meta+z',
          callback: () => {
            if (!shell.history?.canUndo.value) return;
            shell.history.undo();
          },
        }
      : undefined,
    shell.history
      ? {
          id: 'shell/redo',
          key: 'meta+shift+z',
          callback: () => {
            if (!shell.history?.canRedo.value) return;
            shell.history.redo();
          },
        }
      : undefined,
  ];

  for (const shortcut of shortcuts) {
    if (!shortcut) continue;
    shell.shortcuts.add(shortcut);
  }
};
