import { useFullscreen } from '@vueuse/core';

import { Shell } from '../product/types.ts';
import { ShortcutItem } from './useShortcuts.ts';

export const useShellShortcuts = (shell: Shell) => {
  const fullscreen = useFullscreen();
  // TODO make it windows + mac agnostic
  const shortcuts: (ShortcutItem | undefined)[] = [
    {
      id: 'shell/fullscreen',
      helpMenu: { category: 'View', name: 'Toggle Fullscreen' },
      key: 'f',
      callback: fullscreen.toggle,
    },
    shell.annotations
      ? {
          id: 'shell/toggle-annotations',
          helpMenu: { category: 'Annotations', name: 'Toggle Annotating' },
          key: 'a',
          callback: () => {
            if (shell.multiplayer?.room.isReadonly.value) return;
            shell.annotations?.toggle();
          },
        }
      : undefined,
    {
      id: 'shell/toggle-help-menu',
      helpMenu: { category: 'View', name: 'Toggle Help Menu' },
      key: 'h',
      callback: shell.helpMenu.toggle,
    },
    {
      id: 'shell/simulation/stop',
      helpMenu: { category: 'Simulation', name: 'Stop Simulation' },
      key: 'escape',
      callback: () => {
        if (!shell.simulation.current.value) return;
        shell.simulation.stop();
      },
    },
    {
      id: 'shell/simulation/previous-frame',
      helpMenu: { category: 'Simulation', name: 'Previous Frame' },
      key: 'left',
      callback: () => {
        const playhead = shell.simulation.current.value?.playhead;
        if (!playhead || playhead.isFirst()) return;
        playhead.prev();
      },
    },
    {
      id: 'shell/simulation/next-frame',
      helpMenu: { category: 'Simulation', name: 'Next Frame' },
      key: 'right',
      callback: () => {
        const playhead = shell.simulation.current.value?.playhead;
        if (!playhead || playhead.isLast()) return;
        playhead.next();
      },
    },
    {
      id: 'shell/toggle-debug',
      helpMenu: { category: 'View', name: 'Toggle Debug Mode' },
      key: 'd',
      callback: shell.debug.toggle,
    },
    {
      id: 'shell/toggle-component-slot-ui',
      helpMenu: { category: 'View', name: 'Hide Interface' },
      key: 'meta+.',
      callback: shell.componentSlots.visibility.toggle,
    },
    {
      id: 'shell/zoom-out',
      helpMenu: { category: 'Camera', name: 'Zoom Out' },
      key: '-',
      callback: () => shell.surface.camera.actions.zoomOut(),
    },
    {
      id: 'shell/zoom-in',
      helpMenu: { category: 'Camera', name: 'Zoom In' },
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
          helpMenu: { category: 'History', name: 'Undo' },
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
          helpMenu: { category: 'History', name: 'Redo' },
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
