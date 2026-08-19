import { computed } from 'vue';

import { useAnnotationControls } from '../useAnnotationControls.ts';

/**
 * the stroke options stand down mid-erase: the eraser ring is a fixed size and paints
 * nothing, so neither the color nor the weight in hand has anything to say
 */
export const useDisabledWhileErasing = () => {
  const controls = useAnnotationControls();
  return computed(() => controls.mode.value === 'erasing');
};
