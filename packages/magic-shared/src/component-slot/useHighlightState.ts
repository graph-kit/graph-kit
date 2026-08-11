import { computed, useAttrs } from 'vue';

import { HighlightProps } from './types.ts';

const highlightAttr = 'highlight';

/**
 * reads the highlight state ComponentSlots.vue passes down. components that
 * want their own control over rendering it should pair this with
 * `defineOptions({ inheritAttrs: false })`, so the `class` fallthrough it
 * would otherwise auto-apply to their root doesn't compete with theirs
 */
export const useHighlightState = () => {
  const attrs = useAttrs();
  if (!(highlightAttr in attrs)) return;
  return computed(() => attrs[highlightAttr] as HighlightProps);
};
