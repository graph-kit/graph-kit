import { crossPattern } from '@canvas/surface/crossPattern';
import { dark } from '@graph/theme-presets/dark/index';
import { light } from '@graph/theme-presets/light/index';
import { Magic } from '@magic/shared/product';

import { computed, onMounted, watch } from 'vue';

export const useCanvasTheme = (magic: Magic) => {
  const theme = computed(() =>
    magic.appearance.state.value === 'dark' ? dark : light,
  );
  const canvas = computed(() => magic.surface.canvas.value);

  const setCanvasColor = () => {
    if (!canvas.value) return console.warn('no canvas found in DOM');
    canvas.value.style.backgroundColor = theme.value.canvas['canvas.color'];
  };

  watch(theme, setCanvasColor);

  onMounted(setCanvasColor);

  magic.surface.draw.backgroundPattern.value = crossPattern((alpha) =>
    theme.value.canvas['canvas.patternColor'](alpha),
  );
};
