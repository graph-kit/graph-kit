import type { MathfieldElement } from '@magic/shared/latex';

import type { Query } from '../../queries.ts';
import { useSetsLatexField } from './useSetsLatexField.ts';

/**
 * hands a query the mathfield rendering it, so the rest of the product can write to the
 * query without holding a component instance.
 *
 * the returned handler belongs on that field's ready event, which is when mathlive has
 * loaded and there is an element to hand over.
 */
export const useQueryEditor = (query: Query) => {
  // undefined until the field is ready, which a component can unmount without ever reaching
  let unmount: (() => void) | undefined;

  const onMounted = (element: MathfieldElement) => {
    useSetsLatexField(element);

    unmount = query.editor.mount({
      element,
      insert: (latexString) => element.executeCommand(['insert', latexString]),
    });
  };

  return {
    onMounted,
    onUnmounted: () => unmount?.(),
  };
};
