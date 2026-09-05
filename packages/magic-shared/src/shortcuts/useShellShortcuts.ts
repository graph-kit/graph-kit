import { useFullscreen } from '@vueuse/core';

import { Shell } from '../product/types.ts';
import { HELP_MENU_KEY } from '../ui/help-menu/useHelpMenuState.ts';
import { useAnnotationsShortcuts } from './useAnnotationsShortcuts.ts';
import { useCameraShortcuts } from './useCameraShortcuts.ts';
import { useHistoryShortcuts } from './useHistoryShortcuts.ts';
import { ShortcutItem } from './useShortcuts.ts';
import { useSimulationShortcuts } from './useSimulationShortcuts.ts';

export const useShellShortcuts = (shell: Shell) => {
  const fullscreen = useFullscreen();
  const shortcuts: ShortcutItem[] = [
    {
      id: 'shell/fullscreen',
      helpMenu: { category: 'View', name: 'Toggle Fullscreen' },
      key: 'f',
      callback: fullscreen.toggle,
    },
    {
      id: 'shell/toggle-help-menu',
      helpMenu: { category: 'View', name: 'Toggle Help Menu' },
      key: HELP_MENU_KEY,
      callback: shell.helpMenu.toggle,
    },
    {
      id: 'shell/toggle-debug',
      helpMenu: { category: 'View', name: 'Toggle Debug' },
      key: 'mod+d',
      callback: shell.debug.toggle,
    },
    {
      id: 'shell/toggle-component-slot-ui',
      helpMenu: { category: 'View', name: 'Hide Interface' },
      key: 'mod+.',
      callback: shell.componentSlots.visibility.toggle,
    },
    ...useCameraShortcuts(shell),
    ...useAnnotationsShortcuts(shell),
    ...useSimulationShortcuts(shell),
    ...useHistoryShortcuts(shell),
  ];

  for (const shortcut of shortcuts) {
    shell.shortcuts.add(shortcut);
  }
};
