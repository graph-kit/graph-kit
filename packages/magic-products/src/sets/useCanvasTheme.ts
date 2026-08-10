import { crossPattern } from '@canvas/surface/crossPattern';
import { Magic } from '@magic/shared/product';

import { computed, onMounted, watch } from 'vue';

import { SetsProductState } from './useSetsProduct.ts';

export const useCanvasTheme = (
  magic: Magic,
  theme: SetsProductState['theme'],
) => {
  const canvas = computed(() => magic.surface.canvas.value);

  const setCanvasColor = () => {
    if (!canvas.value) return console.warn('no canvas found in DOM');
    canvas.value.style.backgroundColor = theme.value.canvas.color;
  };

  watch(theme, setCanvasColor);

  onMounted(setCanvasColor);

  magic.surface.draw.backgroundPattern.value = crossPattern((alpha) =>
    theme.value.canvas.patternColor(alpha),
  );
};
