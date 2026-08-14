import { Graph } from '../graph/types.ts';
import { Magic } from '../product/types.ts';
import { ShortcutItem } from '../shortcuts/useShortcuts.ts';

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
