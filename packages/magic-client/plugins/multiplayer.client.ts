import {
  createMultiplayer,
  provideMultiplayer,
} from '@magic/shared/multiplayer';
import { assertIsProductId } from '@magic/shared/product/manifests/isValidProductId';
import { navigateToProduct } from '@magic/shared/ui';

export default defineNuxtPlugin((nuxtApp) => {
  const serverUrl = useRuntimeConfig().public.multiplayerServerUrl;
  if (!serverUrl) return;

  const multiplayer = createMultiplayer({
    serverUrl,
    onMovedToProduct: (productId) => {
      assertIsProductId(productId);
      navigateToProduct(productId);
    },
  });

  provideMultiplayer(nuxtApp.vueApp, multiplayer);
});
