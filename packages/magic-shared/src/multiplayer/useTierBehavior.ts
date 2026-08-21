import { Tier } from '@multiplayer/protocol/tiers';

import { ComputedRef, watch } from 'vue';

import { TierBehavior } from '../product/types.ts';
import { RoomState } from './types.ts';

type TierBehaviorOptions = {
  room: ComputedRef<RoomState>;
  /** what the host decided each tier means for it, see {@link MultiplayerHostField.tiers} */
  tiers: Record<Tier, TierBehavior>;
};

/**
 * Runs the host's tier callbacks as the local user's tier changes, which is the one place
 * a tier turns into anything happening on this client.
 *
 * Held tier rather than watched value, because the room state is rebuilt on every roster
 * change and only a tier that actually moved is a transition. Out of the room is no tier
 * at all, so a member who leaves exits whatever they held.
 */
export const useTierBehavior = ({ room, tiers }: TierBehaviorOptions) => {
  let held: Tier | undefined;

  const apply = (next: Tier | undefined) => {
    if (next === held) return;

    if (held) tiers[held].exit?.();
    held = next;
    if (next) tiers[next].enter?.();
  };

  watch(() => (room.value.connected ? room.value.me.tier : undefined), apply, {
    immediate: true,
  });
};
