import * as Y from 'yjs';

/**
 * Marks writes a binding makes into the document, so that binding skips them when they
 * come back around as a transaction.
 * Distinct from the connection's remote origin, which decides what goes on the wire.
 */
export const BINDING_ORIGIN = Symbol('multiplayer/binding');

/**
 * The same, for a write that tidies the document rather than carrying an edit of this
 * user's. Kept apart so undo, which tracks BINDING_ORIGIN, cannot reverse it: a client
 * clearing up after somebody else's change has nothing to put back.
 */
export const RECONCILE_ORIGIN = Symbol('multiplayer/reconcile');

/** a transaction this binding wrote, which it has already applied to the product */
export const isOwnWrite = (transaction: Y.Transaction) =>
  transaction.origin === BINDING_ORIGIN ||
  transaction.origin === RECONCILE_ORIGIN;
