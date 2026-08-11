import { dark } from '@graph/theme-presets/dark/index';
import { light } from '@graph/theme-presets/light/index';
import { Magic } from '@magic/shared/product';

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

export const useSetsTheme = (magic: Magic) => {
  const theme = computed(() =>
    magic.appearance.state.value === 'dark' ? dark : light,
  );

  return computed<SetsTheme>(() => ({
    set: {
      outline: {
        default: theme.value.canvas['node.default.border.color'],
        focused: theme.value.focus['node.focus.border.color'],
      },
      label: theme.value.canvas['node.default.text.color'],
    },
    canvas: {
      color: theme.value.canvas['canvas.color'],
      patternColor: theme.value.canvas['canvas.patternColor'],
    },
  }));
};
