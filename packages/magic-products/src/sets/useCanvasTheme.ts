import { crossPattern } from '@canvas/surface/crossPattern';
import { Shell } from '@magic/shared/product';

import { computed, onMounted, watch } from 'vue';

import { SetsProductState } from './useSetsProduct.ts';

export const useCanvasTheme = (
  shell: Shell,
  setsProductState: SetsProductState,
) => {
  const { theme } = setsProductState;
  const canvas = computed(() => shell.surface.canvas.value);

  const setCanvasColor = () => {
    if (!canvas.value) return console.warn('no canvas found in DOM');
    canvas.value.style.backgroundColor = theme.value.canvas.color;
  };

  watch(theme, setCanvasColor);

  onMounted(setCanvasColor);

  shell.surface.draw.backgroundPattern.value = crossPattern((alpha) =>
    theme.value.canvas.patternColor(alpha),
  );
};
