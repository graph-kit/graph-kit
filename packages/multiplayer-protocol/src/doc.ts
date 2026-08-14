/**
 * A Yjs update, on the wire. Opaque here on purpose: the server never inspects one, it
 * relays and merges, which is what keeps it agnostic to what any product stores.
 *
 * Yjs updates are commutative and idempotent, so applying the same set in any order
 * lands on the same state. That is what removes the version counters, the state hashes
 * and the resync path this protocol used to need.
 */
export type DocUpdate = Uint8Array;

/**
 * What a client already has, so a peer can reply with only what is missing. Produced by
 * `Y.encodeStateVector`, consumed by `Y.encodeStateAsUpdate`.
 */
export type DocStateVector = Uint8Array;
