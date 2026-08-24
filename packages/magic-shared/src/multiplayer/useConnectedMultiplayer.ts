import { assert, nullThrows } from '@core/utils/assert';

import { computed } from 'vue';

import { useProvidedShell } from '../product/context.ts';

/** for anything that only ever exists inside a room, which can then read it directly */
export const useConnectedMultiplayer = () => {
  const shell = useProvidedShell();

  const multiplayer = computed(() =>
    nullThrows(
      shell.multiplayer,
      'multiplayer: read on a product without a room',
    ),
  );

  const room = computed(() => {
    const state = multiplayer.value.room.state.value;
    assert(
      state.connected,
      'multiplayer: read a room while not connected to one',
    );
    return state;
  });

  return { multiplayer, room };
};
