import * as Y from 'yjs';

import { BINDING_ORIGIN } from './origins.ts';

export type DocWriter = {
  /**
   * Writes into the document, unless what is being written is what the document just
   * told us, which would send it straight back out again.
   */
  intoDoc: (write: () => void, origin?: symbol) => void;
  /**
   * Writes into the product, holding the flag that tells the writes it causes from the
   * user's own. Product events are triggered inside the write's own stack frame, so a
   * handler always observes the flag the apply that reached it set.
   */
  intoProduct: (apply: () => void) => void;
};

export const createDocWriter = (doc: Y.Doc): DocWriter => {
  let applyingFromDoc = false;

  return {
    intoDoc: (write, origin = BINDING_ORIGIN) => {
      if (applyingFromDoc) return;
      doc.transact(write, origin);
    },

    intoProduct: (apply) => {
      applyingFromDoc = true;
      try {
        apply();
      } finally {
        applyingFromDoc = false;
      }
    },
  };
};
