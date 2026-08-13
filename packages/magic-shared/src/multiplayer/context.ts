import { inject, provide } from 'vue';

import { MultiplayerControls } from './createMultiplayer.ts';

const MULTIPLAYER_KEY = 'MAGIC_MULTIPLAYER';

/** called once at the application root, never by a product */
export const provideMultiplayer = (multiplayer: MultiplayerControls) => {
  provide(MULTIPLAYER_KEY, multiplayer);
};

/**
 * Undefined rather than throwing when absent, because absence is a normal state: the
 * plugin is client only, so nothing is provided during prerender, and a deployment
 * without a configured server runs the whole app with multiplayer simply switched off.
 */
export const useProvidedMultiplayer = () =>
  inject<MultiplayerControls | undefined>(MULTIPLAYER_KEY, undefined);
