import { Shell } from '../product/types.ts';
import { ShortcutItem } from './useShortcuts.ts';

export const useHistoryShortcuts = (shell: Shell): ShortcutItem[] => {
  if (!shell.history) return [];
  return [
    {
      id: 'shell/undo',
      helpMenu: { category: 'History', name: 'Undo' },
      key: 'mod+z',
      callback: () => {
        if (!shell.history?.canUndo.value) return;
        shell.history.undo();
      },
    },
    {
      id: 'shell/redo',
      helpMenu: { category: 'History', name: 'Redo' },
      key: 'mod+shift+z',
      callback: () => {
        if (!shell.history?.canRedo.value) return;
        shell.history.redo();
      },
    },
  ];
};
