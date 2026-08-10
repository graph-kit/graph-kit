import { computed } from 'vue';

import { ThemePreset } from './graph/index.ts';
import { useProvidedMagic } from './product/context.ts';

export const useThemeToClasses = (
  themeToClasses: Record<ThemePreset, string>,
) => {
  const magic = useProvidedMagic();
  return computed(() => themeToClasses[magic.appearance.state.value]);
};
