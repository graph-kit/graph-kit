import { Graph } from '../graph/types.ts';
import { Shell } from '../product/types.ts';
import { ShortcutItem } from '../shortcuts/useShortcuts.ts';

export const useGraphShellShortcuts = (shell: Shell, graph: Graph) => {
  // TODO make it windows + mac agnostic
  const shortcuts: ShortcutItem[] = [
    {
      id: 'shell/focus-all',
      helpMenu: { category: 'Canvas', name: 'Select All' },
      key: 'meta+a',
      callback: graph.focus.setAll,
    },
  ];

  for (const shortcut of shortcuts) {
    shell.shortcuts.add(shortcut);
  }
};
