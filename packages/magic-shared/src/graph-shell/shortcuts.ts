import { Graph } from '../graph/types.ts';
import { Shell } from '../product/types.ts';
import { ShortcutItem } from '../shortcuts/useShortcuts.ts';
import { GRAPH_HELP_CATEGORY } from './help.ts';

export const useGraphShellShortcuts = (shell: Shell, graph: Graph) => {
  const shortcuts: ShortcutItem[] = [
    {
      id: 'shell/graph/focus-all',
      helpMenu: { category: GRAPH_HELP_CATEGORY, name: 'Select All' },
      key: 'mod+a',
      callback: graph.focus.setAll,
    },
  ];

  for (const shortcut of shortcuts) {
    shell.shortcuts.add(shortcut);
  }
};
