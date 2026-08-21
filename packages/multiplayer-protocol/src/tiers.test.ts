import { describe, expect, it } from 'vitest';

import { canSetTier, meetsFloor, rankOf } from './tiers.ts';

describe('tier ordinal', () => {
  it('ranks host above admin above write above read', () => {
    expect(rankOf('host')).toBeGreaterThan(rankOf('admin'));
    expect(rankOf('admin')).toBeGreaterThan(rankOf('write'));
    expect(rankOf('write')).toBeGreaterThan(rankOf('read'));
  });

  it('treats a floor as inclusive', () => {
    expect(meetsFloor('admin', 'admin')).toBe(true);
    expect(meetsFloor('host', 'admin')).toBe(true);
    expect(meetsFloor('write', 'admin')).toBe(false);
  });

  it('puts read below the product write floor', () => {
    expect(meetsFloor('read', 'write')).toBe(false);
    expect(meetsFloor('write', 'write')).toBe(true);
  });
});

describe('canSetTier', () => {
  it('lets the host assign every assignable tier', () => {
    expect(canSetTier('host', 'write', 'admin')).toBe(true);
    expect(canSetTier('host', 'admin', 'write')).toBe(true);
    expect(canSetTier('host', 'write', 'read')).toBe(true);
  });

  it('lets an admin assign below itself but not sideways', () => {
    expect(canSetTier('admin', 'write', 'write')).toBe(true);
    expect(canSetTier('admin', 'write', 'admin')).toBe(false);
  });

  it('blocks write entirely', () => {
    expect(canSetTier('write', 'write', 'write')).toBe(false);
    expect(canSetTier('write', 'admin', 'write')).toBe(false);
  });

  // the ordinal rule alone would allow both, since read is the tier below them
  it('blocks a demotion to read from anyone under the room command floor', () => {
    expect(canSetTier('write', 'write', 'read')).toBe(false);
    expect(canSetTier('read', 'write', 'read')).toBe(false);
    expect(canSetTier('admin', 'write', 'read')).toBe(true);
  });

  // without this guard an admin could orphan disband-on-host-disconnect
  it('never allows demoting the host', () => {
    expect(canSetTier('admin', 'host', 'write')).toBe(false);
    expect(canSetTier('host', 'host', 'write')).toBe(false);
  });
});
