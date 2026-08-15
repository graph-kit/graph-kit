import { describe, expect, it } from 'vitest';

import { canSetTier, meetsFloor, rankOf } from './tiers.ts';

describe('tier ordinal', () => {
  it('ranks host above admin above write', () => {
    expect(rankOf('host')).toBeGreaterThan(rankOf('admin'));
    expect(rankOf('admin')).toBeGreaterThan(rankOf('write'));
  });

  it('treats a floor as inclusive', () => {
    expect(meetsFloor('admin', 'admin')).toBe(true);
    expect(meetsFloor('host', 'admin')).toBe(true);
    expect(meetsFloor('write', 'admin')).toBe(false);
  });
});

describe('canSetTier', () => {
  it('lets the host assign every assignable tier', () => {
    expect(canSetTier('host', 'write', 'admin')).toBe(true);
    expect(canSetTier('host', 'admin', 'write')).toBe(true);
  });

  it('lets an admin assign below itself but not sideways', () => {
    expect(canSetTier('admin', 'write', 'write')).toBe(true);
    expect(canSetTier('admin', 'write', 'admin')).toBe(false);
  });

  it('blocks write entirely', () => {
    expect(canSetTier('write', 'write', 'write')).toBe(false);
    expect(canSetTier('write', 'admin', 'write')).toBe(false);
  });

  // without this guard an admin could orphan disband-on-host-disconnect
  it('never allows demoting the host', () => {
    expect(canSetTier('admin', 'host', 'write')).toBe(false);
    expect(canSetTier('host', 'host', 'write')).toBe(false);
  });
});
