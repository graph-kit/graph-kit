import * as Y from 'yjs';

import { computed, ref } from 'vue';

import { HistoryField } from '../../product/types.ts';
import { BINDING_ORIGIN } from './origins.ts';

/**
 * Undo over the shared types rather than over whole product snapshots, which is what
 * makes it safe with other people writing: it reverses the items this client wrote and
 * merges with everything else, where restoring a snapshot would rewrite a peer's work
 * too.
 */
export const createDocHistory = (
  doc: Y.Doc,
  // `any` rather than `unknown`, matching Y.UndoManager's own signature: the element
  // type is invariant here, so a map of anything concrete is not assignable otherwise
  types: Y.AbstractType<any>[],
): HistoryField => {
  const undoManager = new Y.UndoManager(types, {
    // BINDING_ORIGIN is the only origin a local edit carries, so tracking it and nothing
    // else is what scopes undo to this client
    trackedOrigins: new Set([BINDING_ORIGIN]),
  });

  const refresh = ref(0);
  const bump = () => refresh.value++;
  undoManager.on('stack-item-added', bump);
  undoManager.on('stack-item-popped', bump);
  undoManager.on('stack-cleared', bump);

  const history: HistoryField = {
    canUndo: computed(() => {
      refresh.value;
      return undoManager.undoStack.length > 0;
    }),
    canRedo: computed(() => {
      refresh.value;
      return undoManager.redoStack.length > 0;
    }),
    undo: () => undoManager.undo(),
    redo: () => undoManager.redo(),
    clear: () => undoManager.clear(),
  };

  // the doc outlives no product, so the manager goes with it
  doc.on('destroy', () => undoManager.destroy());

  return history;
};
