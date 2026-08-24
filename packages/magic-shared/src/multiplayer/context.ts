import { App, inject } from 'vue';

import { ConnectionControls } from './types.ts';

const MULTIPLAYER_KEY = 'MAGIC_MULTIPLAYER';

/**
 * App level rather than component level, because the only caller is the root plugin and
 * `provide()` needs an active component instance, which a plugin does not have.
 */
export const provideMultiplayer = (
  app: App,
  multiplayer: ConnectionControls,
): void => {
  app.provide(MULTIPLAYER_KEY, multiplayer);
};

/**
 * Undefined rather than throwing when absent, because absence is a normal state: the
 * plugin is client only, so nothing is provided during prerender, and a deployment
 * without a configured server runs the whole app with multiplayer simply switched off.
 */
export const useProvidedMultiplayer = (): ConnectionControls | undefined =>
  inject<ConnectionControls | undefined>(MULTIPLAYER_KEY, undefined);
