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

/**
 * Normalises what socket.io hands back, which is a Buffer under node but an ArrayBuffer
 * in a browser. Yjs reads a Uint8Array and nothing else: an ArrayBuffer throws
 * "Unexpected end of array" rather than decoding to nothing, so every update coming off
 * the wire passes through here.
 *
 * A Buffer already is a Uint8Array, which is why a node client never sees the problem
 * and why no test running one can catch it.
 */
export const toDocUpdate = (data: DocUpdate | ArrayBufferLike): DocUpdate =>
  data instanceof Uint8Array ? data : new Uint8Array(data);
