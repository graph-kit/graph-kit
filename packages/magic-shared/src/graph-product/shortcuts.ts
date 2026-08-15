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
  ];

  for (const shortcut of shortcuts) {
    magic.shortcuts.add(shortcut);
  }
};
