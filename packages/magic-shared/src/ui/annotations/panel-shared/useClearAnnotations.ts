import { computed } from 'vue';

import { useAnnotationControls } from '../useAnnotationControls.ts';

export const useClearAnnotations = () => {
  const { annotations, clear } = useAnnotationControls();

  const disabledReason = computed(() =>
    annotations.value.length === 0 ? 'Nothing to clear yet' : false,
  );

  return { clear, disabledReason };
};
