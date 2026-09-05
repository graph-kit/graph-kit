import { Shell } from '../product/types.ts';
import { ShortcutItem } from './useShortcuts.ts';

export const useCameraShortcuts = (shell: Shell): ShortcutItem[] => [
  {
    id: 'shell/zoom-in',
    key: 'shift++',
    callback: () => shell.surface.camera.actions.zoomIn(),
  },
  {
    id: 'shell/zoom-in-unshifted',
    helpMenu: { category: 'Camera', name: 'Zoom In' },
    key: '=',
    callback: () => shell.surface.camera.actions.zoomIn(),
  },
  {
    id: 'shell/zoom-out',
    helpMenu: { category: 'Camera', name: 'Zoom Out' },
    key: '-',
    callback: () => shell.surface.camera.actions.zoomOut(),
  },
];
