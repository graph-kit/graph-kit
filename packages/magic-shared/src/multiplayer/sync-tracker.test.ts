import { describe, expect, it } from 'vitest';

import { createSyncTracker } from './sync-tracker.ts';

describe('provenance', () => {
  it('marks the flag only for the duration of an apply', () => {
    const sync = createSyncTracker();
    const observed: boolean[] = [];

    expect(sync.isApplyingRemote()).toBe(false);
    sync.applyRemote(() => observed.push(sync.isApplyingRemote()));
    expect(sync.isApplyingRemote()).toBe(false);

    expect(observed).toEqual([true]);
  });

  // a boolean would clear on the inner return and let the outer apply echo
  it('survives nesting', () => {
    const sync = createSyncTracker();
    let innerSawFlag = false;
    let outerSawFlagAfterInner = false;

    sync.applyRemote(() => {
      sync.applyRemote(() => {
        innerSawFlag = sync.isApplyingRemote();
      });
      outerSawFlagAfterInner = sync.isApplyingRemote();
    });

    expect(innerSawFlag).toBe(true);
    expect(outerSawFlagAfterInner).toBe(true);
    expect(sync.isApplyingRemote()).toBe(false);
  });

  // leaking the flag would silently kill outbound sync for the rest of the session
  it('clears the flag when the apply throws', () => {
    const sync = createSyncTracker();

    expect(() =>
      sync.applyRemote(() => {
        throw new Error('applier blew up');
      }),
    ).toThrow('applier blew up');

    expect(sync.isApplyingRemote()).toBe(false);
  });

  it('returns the applier result', () => {
    const sync = createSyncTracker();

    expect(sync.applyRemote(() => 42)).toBe(42);
  });
});

describe('relay verdicts', () => {
  it('applies the next expected version', () => {
    const sync = createSyncTracker();
    sync.recordApplied('traversals', 4, 'hash-4');

    expect(sync.verdictFor('traversals', 5)).toBe('apply');
  });

  it('resyncs on a gap', () => {
    const sync = createSyncTracker();
    sync.recordApplied('traversals', 4, 'hash-4');

    expect(sync.verdictFor('traversals', 7)).toBe('resync');
  });

  it('ignores a version already applied', () => {
    const sync = createSyncTracker();
    sync.recordApplied('traversals', 4, 'hash-4');

    expect(sync.verdictFor('traversals', 4)).toBe('ignore');
    expect(sync.verdictFor('traversals', 3)).toBe('ignore');
  });

  it('ignores everything while suspended', () => {
    const sync = createSyncTracker();
    sync.recordApplied('traversals', 4, 'hash-4');
    sync.suspend('traversals');

    expect(sync.verdictFor('traversals', 5)).toBe('ignore');

    sync.resume('traversals');
    expect(sync.verdictFor('traversals', 5)).toBe('apply');
  });

  it('tracks suspension per product, not per room', () => {
    const sync = createSyncTracker();
    sync.suspend('basic-trees');

    expect(sync.isSuspended('basic-trees')).toBe(true);
    expect(sync.isSuspended('traversals')).toBe(false);
  });

  // this is the case a receipt based counter misses entirely
  it('leaves a gap when an apply fails, so the next relay resyncs', () => {
    const sync = createSyncTracker();
    sync.recordApplied('traversals', 4, 'hash-4');

    // version 5 arrives and the applier throws, so recordApplied never runs
    expect(() =>
      sync.applyRemote(() => {
        throw new Error('bad op');
      }),
    ).toThrow();

    expect(sync.verdictFor('traversals', 6)).toBe('resync');
  });
});

describe('drift detection', () => {
  it('reports drift when the local hash disagrees', () => {
    const sync = createSyncTracker();
    sync.recordApplied('traversals', 1, 'server-hash');

    expect(sync.hasDrifted('traversals', 'server-hash')).toBe(false);
    expect(sync.hasDrifted('traversals', 'different-hash')).toBe(true);
  });

  // same op count, different values: exactly what the counter cannot see
  it('catches divergence the version counter agrees on', () => {
    const sync = createSyncTracker();
    sync.recordApplied('traversals', 9, 'server-hash');

    expect(sync.verdictFor('traversals', 10)).toBe('apply');
    expect(sync.hasDrifted('traversals', 'locally-wrong')).toBe(true);
  });

  it('does not report drift before anything has been applied', () => {
    const sync = createSyncTracker();

    expect(sync.hasDrifted('traversals', 'anything')).toBe(false);
  });
});

describe('reset', () => {
  it('adopts the server version outright rather than advancing', () => {
    const sync = createSyncTracker();
    sync.recordApplied('traversals', 2, 'hash-2');

    sync.reset('traversals', 40, 'hash-40');

    expect(sync.verdictFor('traversals', 41)).toBe('apply');
    expect(sync.hasDrifted('traversals', 'hash-40')).toBe(false);
  });

  it('forgets a product entirely', () => {
    const sync = createSyncTracker();
    sync.recordApplied('traversals', 5, 'hash-5');
    sync.forget('traversals');

    expect(sync.verdictFor('traversals', 1)).toBe('apply');
  });
});
