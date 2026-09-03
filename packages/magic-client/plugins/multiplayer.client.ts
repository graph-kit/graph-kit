import {
  createMultiplayer,
  provideMultiplayer,
} from '@magic/shared/multiplayer';
import { assertIsProductId } from '@magic/shared/product/manifests/isValidProductId';
import { navigateToProduct } from '@magic/shared/ui';

/** short enough that an unreachable switch cannot hold up the app it gates */
const CONFIG_TIMEOUT_MS = 1_500;

/**
 * Anything but an explicit `false` leaves multiplayer on: a config that cannot be read is
 * a network problem, and failing closed would take the feature down on every slow fetch.
 */
const isEnabled = async (configUrl: string) => {
  try {
    const response = await fetch(configUrl, {
      cache: 'no-store',
      signal: AbortSignal.timeout(CONFIG_TIMEOUT_MS),
    });
    if (!response.ok) return true;

    const config: unknown = await response.json();
    if (typeof config !== 'object' || config === null) return true;
    return (config as { enabled?: unknown }).enabled !== false;
  } catch {
    return true;
  }
};

export default defineNuxtPlugin(async (nuxtApp) => {
  const { multiplayerServerUrl, multiplayerConfigUrl } =
    useRuntimeConfig().public;
  if (!multiplayerServerUrl) return;
  if (!(await isEnabled(multiplayerConfigUrl))) return;

  const multiplayer = createMultiplayer({
    serverUrl: multiplayerServerUrl,
    onMovedToProduct: (productId) => {
      assertIsProductId(productId);
      navigateToProduct(productId);
    },
  });

  provideMultiplayer(nuxtApp.vueApp, multiplayer);
});
