import { BasicColorMode } from '@vueuse/core';

import { onMounted, watch } from 'vue';

import { useDocumentAppearance } from './useDocumentAppearance.ts';

export type AppearanceControls = ReturnType<typeof useShellAppearance>;

/** the document appearance, plus the hand off the graph needs to repaint the canvas */
export const useShellAppearance = (
  onAppearanceChanged: (color: BasicColorMode) => void,
) => {
  const appearance = useDocumentAppearance();

  watch(appearance.state, onAppearanceChanged);

  onMounted(() => onAppearanceChanged(appearance.state.value));

  return appearance;
};
