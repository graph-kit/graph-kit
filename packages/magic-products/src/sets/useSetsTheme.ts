import { dark } from '@graph/theme-presets/dark/index';
import { light } from '@graph/theme-presets/light/index';
import { Shell } from '@magic/shared/product';

import { computed } from 'vue';

export type SetColors = {
  outline: {
    default: string;
    focused: string;
  };
  label: string;
};

type CanvasColors = {
  color: string;
  patternColor: (alpha: string) => string;
};

export type SetsTheme = {
  set: SetColors;
  canvas: CanvasColors;
};

export const useSetsTheme = (shell: Shell) => {
  const theme = computed(() =>
    shell.appearance.state.value === 'dark' ? dark : light,
  );

  return computed<SetsTheme>(() => ({
    set: {
      outline: {
        default: theme.value.surface['node.default.border.color'],
        focused: theme.value.focus['node.focus.border.color'],
      },
      label: theme.value.surface['node.default.text.color'],
    },
    canvas: {
      color: theme.value.surface['canvas.color'],
      patternColor: theme.value.surface['canvas.patternColor'],
    },
  }));
};
