import { describe, expect, it } from 'vitest';

import {
  ASSIGNABLE_TIERS,
  TIERS,
  TIER_ASSIGNMENT_FLOOR,
  Tier,
  canSetTier,
  meetsFloor,
  rankOf,
} from './tiers.ts';

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

  it('lets an admin raise someone as far as its own rank', () => {
    expect(canSetTier('admin', 'write', 'write')).toBe(true);
    expect(canSetTier('admin', 'read', 'admin')).toBe(true);
    expect(canSetTier('admin', 'write', 'admin')).toBe(true);
  });

  // admins are peers, so the tier only comes back off from above: the host
  it('never lets an admin take anything off another admin', () => {
    expect(canSetTier('admin', 'admin', 'write')).toBe(false);
    expect(canSetTier('admin', 'admin', 'read')).toBe(false);
    expect(canSetTier('host', 'admin', 'write')).toBe(true);
  });

  // the target rule reads the caller's own entry when it is aiming at itself
  it('stops an admin demoting itself', () => {
    expect(canSetTier('admin', 'admin', 'read')).toBe(false);
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

// asserted over every tier rather than by example, so a tier added later is covered
describe('tier assignment is reserved for admin and above', () => {
  const canAssignSomething = (caller: Tier) =>
    TIERS.some((target) =>
      ASSIGNABLE_TIERS.some((next) => canSetTier(caller, target, next)),
    );

  it('refuses callers under the floor, whatever they aim at', () => {
    for (const caller of TIERS) {
      if (meetsFloor(caller, TIER_ASSIGNMENT_FLOOR)) continue;
      for (const target of TIERS) {
        for (const next of ASSIGNABLE_TIERS) {
          expect(canSetTier(caller, target, next)).toBe(false);
        }
      }
    }
  });

  it('leaves the host and admin as the only tiers that can assign at all', () => {
    expect(TIERS.filter(canAssignSomething)).toEqual(['host', 'admin']);
  });

  // clearing the floor is necessary, never sufficient: the target still has to be reachable
  it('does not let clearing the floor reach a peer', () => {
    expect(meetsFloor('admin', TIER_ASSIGNMENT_FLOOR)).toBe(true);
    expect(canSetTier('admin', 'admin', 'read')).toBe(false);
  });

  // nobody hands out a rank they do not hold, which is what keeps admin the ceiling
  it('caps what is handed over at the rank the caller holds', () => {
    for (const caller of TIERS) {
      for (const target of TIERS) {
        for (const next of ASSIGNABLE_TIERS) {
          if (!canSetTier(caller, target, next)) continue;
          expect(rankOf(next)).toBeLessThanOrEqual(rankOf(caller));
        }
      }
    }
  });

  // the whole point of splitting the ordinal rules: the group grows sideways, never shrinks
  it('lets the admin group grow but only the host shrink it', () => {
    const demoteAdmin = ASSIGNABLE_TIERS.filter((next) =>
      canSetTier('admin', 'admin', next),
    );
    expect(demoteAdmin).toEqual([]);
    expect(canSetTier('admin', 'write', 'admin')).toBe(true);
    expect(canSetTier('host', 'admin', 'read')).toBe(true);
  });
});
