import { ProductId } from '@multiplayer/protocol/room';

/** what the harness knows about one product's server state: how far it has caught up */
type ProductSync = {
  /** the last version this client successfully applied, not merely received */
  version: number;
  stateHash: string;
};

/** what a client should do with an inbound relay */
export type RelayVerdict = 'apply' | 'resync' | 'ignore';

/**
 * The provenance and drift rules. The singleton owns one of these for the life of the
 * connection, which is why none of it may live on a per product harness instance.
 */
export type SyncTracker = {
  /** marks an inbound apply so outbound encoders can skip the echo it would cause */
  applyRemote: <Result>(apply: () => Result) => Result;
  isApplyingRemote: () => boolean;
  /** after a successful apply, never on receipt, so a failed apply leaves a gap */
  recordApplied: (
    productId: ProductId,
    version: number,
    stateHash: string,
  ) => void;
  /** a gap means something was missed, and the only safe answer is a resync */
  verdictFor: (productId: ProductId, version: number) => RelayVerdict;
  /** catches what the counter cannot: same apply count, different state */
  hasDrifted: (productId: ProductId, localHash: string) => boolean;
  /** adopts a version outright rather than advancing */
  reset: (productId: ProductId, version: number, stateHash: string) => void;
  forget: (productId: ProductId) => void;
  clear: () => void;
};

const emptySync = (): ProductSync => ({
  version: 0,
  stateHash: '',
});

export const createSyncTracker = (): SyncTracker => {
  const productIdToSync = new Map<ProductId, ProductSync>();

  const syncFor = (productId: ProductId) => {
    const existing = productIdToSync.get(productId);
    if (existing) return existing;

    const created = emptySync();
    productIdToSync.set(productId, created);
    return created;
  };

  // a depth counter rather than a boolean so a nested apply cannot clear it early.
  // sound because graph events emit synchronously inside the mutation's own stack
  // frame, so an outbound encoder always observes the flag its apply set.
  let applyDepth = 0;

  return {
    applyRemote: (apply) => {
      applyDepth++;
      try {
        return apply();
      } finally {
        // a throwing applier that leaked this would silently kill outbound sync
        // for the rest of the session
        applyDepth--;
      }
    },

    isApplyingRemote: () => applyDepth > 0,

    recordApplied: (productId, version, stateHash) => {
      const sync = syncFor(productId);
      sync.version = version;
      sync.stateHash = stateHash;
    },

    verdictFor: (productId, version) => {
      const sync = syncFor(productId);
      // a replay of something already applied, which dedupe on the server should
      // prevent but which must never be applied twice regardless
      if (version <= sync.version) return 'ignore';
      if (version === sync.version + 1) return 'apply';
      return 'resync';
    },

    hasDrifted: (productId, localHash) => {
      const sync = syncFor(productId);
      // nothing applied yet means there is nothing to have drifted from
      if (sync.stateHash === '') return false;
      return sync.stateHash !== localHash;
    },

    reset: (productId, version, stateHash) => {
      const sync = syncFor(productId);
      sync.version = version;
      sync.stateHash = stateHash;
    },

    forget: (productId) => {
      productIdToSync.delete(productId);
    },

    clear: () => {
      productIdToSync.clear();
    },
  };
};
