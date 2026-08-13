import { ProductId } from './room.ts';

/**
 * the RFC 6902 subset the client emits. the server applies these blindly and never
 * inspects paths or values, which is what keeps it graph agnostic.
 */
export type PatchOp =
  | { op: 'add'; path: string; value: unknown }
  | { op: 'remove'; path: string }
  | { op: 'replace'; path: string; value: unknown };

/**
 * The server's copy of one product's state: what the room holds for `traversals`, for
 * `basic-trees`, and so on. Authoritative, and the thing a client's local state is a
 * mirror of rather than the other way around.
 *
 * Opaque here on purpose. The server stores and relays it without ever knowing what a
 * node or an edge is, so the shape is decided entirely by the product that owns it (see
 * GraphServerState in the harness). The one constraint the shape must honour is being
 * id-keyed rather than array-based, so every patch path stays valid no matter what
 * order concurrent relays land in.
 */
export type ServerState = Record<string, unknown>;

/** one product's server state plus how far it has advanced, as the room stores it */
export type ProductRecord = {
  state: ServerState;
  version: number;
};

/** for server side dedupe of retransmits and for tracing one payload across clients */
export type PayloadId = string;

type RelayEnvelope = {
  payloadId: PayloadId;
  productId: ProductId;
  /** monotonic per product, advanced by the server on every accepted write */
  version: number;
  /** canonical hash of the product's server state after this write, for drift detection */
  stateHash: string;
};

export type ServerStatePatchRelay = RelayEnvelope & { ops: PatchOp[] };

export type ServerStateReplaceRelay = RelayEnvelope & { state: ServerState };

/**
 * key insertion order diverges between a server object built by applyPatch and a client
 * object built fresh from its own state, so an order sensitive stringify would report
 * constant false drift. sorting makes the two comparable.
 */
const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value === null || typeof value !== 'object') return value;

  const sortedEntries = Object.entries(value as Record<string, unknown>).sort(
    ([leftKey], [rightKey]) => leftKey.localeCompare(rightKey),
  );

  const canonical: Record<string, unknown> = {};
  for (const [key, entryValue] of sortedEntries) {
    canonical[key] = canonicalize(entryValue);
  }
  return canonical;
};

/** FNV-1a, sized to catch accidental drift rather than tampering */
export const hashServerState = (state: ServerState) => {
  const canonical = JSON.stringify(canonicalize(state));
  let hash = 2166136261;
  for (let i = 0; i < canonical.length; i++) {
    hash ^= canonical.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
};
