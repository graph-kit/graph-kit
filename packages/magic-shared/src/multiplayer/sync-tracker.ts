import { ProductId } from '@multiplayer/protocol/room';

/**
 * what the harness knows about one product's server state: how far it has caught up, and
 * whether it is currently ignoring the room entirely
 */
type ProductSync = {
  /** the last version this client successfully applied, not merely received */
  version: number;
  stateHash: string;
  suspended: boolean;
};

/** what a client should do with an inbound relay */
export type RelayVerdict = 'apply' | 'resync' | 'ignore';

const emptySync = (): ProductSync => ({
  version: 0,
  stateHash: '',
  suspended: false,
});

/**
 * the provenance and drift rules, kept free of sockets and vue so they can be tested
 * directly. the singleton owns one of these for the life of the connection, which is
 * why none of it may live on a per product harness instance.
 */
export const createSyncTracker = () => {
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
    /**
     * Runs an inbound apply with provenance marked. Every outbound encoder checks
     * {@link isApplyingRemote} and returns early, which is what stops a client from
     * rebroadcasting a change it only just received.
     */
    applyRemote: <Result>(apply: () => Result): Result => {
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

    suspend: (productId: ProductId) => {
      syncFor(productId).suspended = true;
    },

    resume: (productId: ProductId) => {
      syncFor(productId).suspended = false;
    },

    isSuspended: (productId: ProductId) => syncFor(productId).suspended,

    /**
     * Records a version the client has caught up to. Called after a successful apply,
     * never on receipt, so an op that arrived intact but failed to apply locally leaves
     * a gap the next relay detects.
     */
    recordApplied: (
      productId: ProductId,
      version: number,
      stateHash: string,
    ) => {
      const sync = syncFor(productId);
      sync.version = version;
      sync.stateHash = stateHash;
    },

    /**
     * Whether an inbound relay is the next one expected. A gap means something was
     * missed, and the only safe response is to take the server's state wholesale.
     */
    verdictFor: (productId: ProductId, version: number): RelayVerdict => {
      const sync = syncFor(productId);
      if (sync.suspended) return 'ignore';
      // a replay of something already applied, which dedupe on the server should
      // prevent but which must never be applied twice regardless
      if (version <= sync.version) return 'ignore';
      if (version === sync.version + 1) return 'apply';
      return 'resync';
    },

    /**
     * Compares a freshly computed local hash against what the server reported. Catches
     * the case a version counter cannot: the same number of applies landing on
     * different state.
     */
    hasDrifted: (productId: ProductId, localHash: string) => {
      const sync = syncFor(productId);
      // nothing applied yet means there is nothing to have drifted from
      if (sync.stateHash === '') return false;
      return sync.stateHash !== localHash;
    },

    /** a fresh server state replaces rather than advances, so it never consults the counter */
    reset: (productId: ProductId, version: number, stateHash: string) => {
      const sync = syncFor(productId);
      sync.version = version;
      sync.stateHash = stateHash;
    },

    forget: (productId: ProductId) => {
      productIdToSync.delete(productId);
    },

    clear: () => {
      productIdToSync.clear();
    },
  };
};

export type SyncTracker = ReturnType<typeof createSyncTracker>;
