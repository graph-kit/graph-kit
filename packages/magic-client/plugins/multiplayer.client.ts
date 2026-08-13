import {
  createMultiplayer,
  provideMultiplayer,
} from '@magic/shared/multiplayer';
import { manifests } from '@magic/shared/product';
import { navigateToProduct } from '@magic/shared/ui';

/**
 * Client only, and deliberately so. The site is prerendered with `nuxt generate`, so a
 * universal plugin would try to open a socket during the build.
 *
 * Installed at the root rather than by a product because every product is its own page:
 * a connection owned by a product's harness would be torn down on each navigation, and
 * a host's would disband their own room every time they switched products.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const serverUrl = useRuntimeConfig().public.multiplayerServerUrl;

  // absence is a normal state, not a failure: a deployment without a configured server
  // runs the whole app with multiplayer switched off, and products fall back to local
  if (!serverUrl) return;

  const multiplayer = createMultiplayer({
    serverUrl,
    // the server sends a productId and nothing about routes. turning one into a url is
    // a client concern, and the mounting product then registers for its own state
    // exactly as it would on any other navigation
    onMovedToProduct: (productId) => {
      const manifest = manifests[productId as keyof typeof manifests];
      if (!manifest) return;
      navigateToProduct(manifest);
    },
  });

  nuxtApp.vueApp.runWithContext(() => provideMultiplayer(multiplayer));
});
