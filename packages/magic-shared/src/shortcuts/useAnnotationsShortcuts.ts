import { computed } from 'vue';

import { Shell } from '../product/types.ts';
import { ShortcutItem } from './useShortcuts.ts';

export const useAnnotationsShortcuts = (shell: Shell): ShortcutItem[] => {
  const annotations = shell.annotations;
  if (!annotations) return [];

  const isActive = computed(() => annotations.isActive.value);
  const isReadonly = computed(() => shell.multiplayer?.room.isReadonly.value);

  return [
    {
      id: 'shell/annotations/toggle',
      helpMenu: { category: 'Annotations', name: 'Toggle Annotating' },
      key: 'a',
      callback: () => {
        if (isReadonly.value) return;
        annotations.toggle();
      },
    },
    {
      id: 'shell/annotations/tools/draw',
      helpMenu: { category: 'Annotations', name: 'Draw Tool' },
      key: 'd',
      callback: () => {
        if (isReadonly.value || !isActive.value) return;
        annotations.setMode('drawing');
      },
    },
    {
      id: 'shell/annotations/tools/erase',
      helpMenu: { category: 'Annotations', name: 'Erase Tool' },
      key: 'e',
      callback: () => {
        if (isReadonly.value || !isActive.value) return;
        annotations.setMode('erasing');
      },
    },
    {
      id: 'shell/annotations/tools/laser',
      helpMenu: { category: 'Annotations', name: 'Laser Tool' },
      key: 'l',
      callback: () => {
        if (isReadonly.value || !isActive.value) return;
        annotations.setMode('laser');
      },
    },
    {
      id: 'shell/annotations/clear',
      helpMenu: { category: 'Annotations', name: 'Clear All' },
      key: 'shift+c',
      callback: () => {
        if (isReadonly.value) return;
        annotations.clear();
      },
    },
  ];
};
