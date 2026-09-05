import { Tier } from '@multiplayer/protocol/tiers';
import { describe, expect, it, vi } from 'vitest';

import { computed, nextTick, ref } from 'vue';

import { TierBehavior } from '../product/types.ts';
import { RoomState } from './types.ts';
import { useTierBehavior } from './useTierBehavior.ts';

const disconnected = { connected: false } as RoomState;

const connectedAt = (tier: Tier, rosterVersion = 0) =>
  ({
    connected: true,
    id: 'room-1',
    userIdToRosterEntry: { 'user-1': { rosterVersion } },
    userIdToPresence: {},
    me: { id: 'user-1', tier, isHost: false },
  }) as unknown as RoomState;

const setup = (initial: RoomState) => {
  const calls: string[] = [];
  const state = ref(initial);

  const track = (tier: Tier): TierBehavior => ({
    enter: () => calls.push(`enter:${tier}`),
    exit: () => calls.push(`exit:${tier}`),
  });

  useTierBehavior({
    room: computed(() => state.value),
    tiers: {
      host: track('host'),
      admin: track('admin'),
      write: track('write'),
      read: track('read'),
    },
  });

  return { calls, state };
};

describe(useTierBehavior, () => {
  it('enters the tier the local user is already holding', () => {
    const { calls } = setup(connectedAt('read'));
    expect(calls).toEqual(['enter:read']);
  });

  it('enters nothing outside a room', () => {
    const { calls } = setup(disconnected);
    expect(calls).toEqual([]);
  });

  it('exits the old tier before entering the new one', async () => {
    const { calls, state } = setup(connectedAt('read'));

    state.value = connectedAt('write');
    await nextTick();

    expect(calls).toEqual(['enter:read', 'exit:read', 'enter:write']);
  });

  it('exits without entering when the room goes away', async () => {
    const { calls, state } = setup(connectedAt('read'));

    state.value = disconnected;
    await nextTick();

    expect(calls).toEqual(['enter:read', 'exit:read']);
  });

  // the room state is rebuilt on every roster change, and none of those are transitions
  it('ignores a room update that leaves the tier where it was', async () => {
    const { calls, state } = setup(connectedAt('read'));

    state.value = connectedAt('read', 1);
    await nextTick();

    expect(calls).toEqual(['enter:read']);
  });

  it('leaves a tier the product said nothing about alone', async () => {
    const state = ref(connectedAt('read'));
    const enter = vi.fn();

    useTierBehavior({
      room: computed(() => state.value),
      tiers: { host: {}, admin: {}, write: {}, read: { enter } },
    });

    state.value = connectedAt('admin');
    await nextTick();

    expect(enter).toHaveBeenCalledTimes(1);
  });
});
