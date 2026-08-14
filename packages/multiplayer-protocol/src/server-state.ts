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
 * The server's copy of one product's state, which local state mirrors rather than the
 * other way around. Opaque here: the shape belongs to the product that owns it, and
 * must be id-keyed so patch paths survive relays landing out of order.
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
/**
 * Canonical over key order, so a server object built by applyPatch and a client one
 * built fresh hash the same. Returns a short hex digest; not a tamper check.
 */
export const hashServerState = (state: ServerState): string => {
  const canonical = JSON.stringify(canonicalize(state));
  let hash = 2166136261;
  for (let i = 0; i < canonical.length; i++) {
    hash ^= canonical.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
};
