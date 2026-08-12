import type { MathfieldElement } from '@magic/shared/latex';

import { onUnmounted, ref } from 'vue';

import { NO_EDITOR, type Query } from '../../queries.ts';
import { useSetsLatexField } from './useSetsLatexField.ts';

/**
 * hands a query the mathfield rendering it, so the rest of the product can write to the
 * query without holding a component instance.
 *
 * the returned handler belongs on that field's ready event, which is when mathlive has
 * loaded and there is an element to hand over.
 */
export const useQueryEditor = (query: Query) => {
  const mathfield = ref<MathfieldElement | null>(null);

  const onReady = (element: MathfieldElement) => {
    mathfield.value = element;
    useSetsLatexField(element);
  };

  query.editor = {
    // a getter, so the query reads the element rather than the null standing in before mount
    get element() {
      return mathfield.value;
    },

    insert: (latexString) =>
      mathfield.value?.executeCommand(['insert', latexString]),
  };

  onUnmounted(() => {
    query.editor = NO_EDITOR;
  });

  return { onReady };
};
