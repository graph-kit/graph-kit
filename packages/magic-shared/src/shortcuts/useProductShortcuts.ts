import { useFullscreen } from '@vueuse/core';

import { Graph } from '../graph/index.ts';
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
  ];

  for (const shortcut of shortcuts) {
    magic.shortcuts.add(shortcut);
  }
};

export const useGraphProductShortcuts = (magic: Magic, graph: Graph) => {
  // TODO make it windows + mac agnostic
  const shortcuts: ShortcutItem[] = [
    {
      id: 'product/focus-all',
      key: 'meta+a',
      callback: graph.focus.setAll,
    },
    {
      id: 'product/undo',
      key: 'meta+z',
      callback: () => {
        if (!graph.history.canUndo.value) return;
        graph.history.undo();
      },
    },
    {
      id: 'product/redo',
      key: 'meta+shift+z',
      callback: () => {
        if (!graph.history.canRedo.value) return;
        graph.history.redo();
      },
    },
  ];

  for (const shortcut of shortcuts) {
    magic.shortcuts.add(shortcut);
  }
};
