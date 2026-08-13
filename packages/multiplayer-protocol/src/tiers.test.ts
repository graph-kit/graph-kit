import { describe, expect, it } from 'vitest';

import { canSetTier, meetsFloor, rankOf } from './tiers.ts';

describe('tier ordinal', () => {
  it('ranks host above admin above write above read', () => {
    expect(rankOf('host')).toBeGreaterThan(rankOf('admin'));
    expect(rankOf('admin')).toBeGreaterThan(rankOf('write'));
    expect(rankOf('write')).toBeGreaterThan(rankOf('read'));
  });

  it('treats a floor as inclusive', () => {
    expect(meetsFloor('write', 'write')).toBe(true);
    expect(meetsFloor('admin', 'write')).toBe(true);
    expect(meetsFloor('read', 'write')).toBe(false);
  });
});

describe('canSetTier', () => {
  it('lets the host assign every assignable tier', () => {
    expect(canSetTier('host', 'read', 'admin')).toBe(true);
    expect(canSetTier('host', 'read', 'write')).toBe(true);
    expect(canSetTier('host', 'admin', 'read')).toBe(true);
  });

  it('lets an admin assign below itself but not sideways', () => {
    expect(canSetTier('admin', 'read', 'write')).toBe(true);
    expect(canSetTier('admin', 'write', 'read')).toBe(true);
    expect(canSetTier('admin', 'read', 'admin')).toBe(false);
  });

  // the floor is a separate condition: strictly-below alone would allow this
  it('blocks write from assigning read despite the ordinal rule permitting it', () => {
    expect(rankOf('write')).toBeGreaterThan(rankOf('read'));
    expect(canSetTier('write', 'read', 'read')).toBe(false);
  });

  it('blocks read entirely', () => {
    expect(canSetTier('read', 'read', 'read')).toBe(false);
  });

  // without this guard an admin could orphan disband-on-host-disconnect
  it('never allows demoting the host', () => {
    expect(canSetTier('admin', 'host', 'read')).toBe(false);
    expect(canSetTier('host', 'host', 'read')).toBe(false);
  });
});
