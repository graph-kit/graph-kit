import { nullThrows } from '@core/utils/assert';
import {
  createMultiplayer,
  provideMultiplayer,
} from '@magic/shared/multiplayer';
import { manifests } from '@magic/shared/product';
import { navigateToProduct } from '@magic/shared/ui';

export default defineNuxtPlugin((nuxtApp) => {
  const serverUrl = useRuntimeConfig().public.multiplayerServerUrl;
  if (!serverUrl) return;

  const multiplayer = createMultiplayer({
    serverUrl,
    onMovedToProduct: (productId) => {
      const manifest = nullThrows(
        manifests[productId as keyof typeof manifests],
        `could not find product manifest with productId ${productId}`,
      );
      navigateToProduct(manifest);
    },
  });

  provideMultiplayer(nuxtApp.vueApp, multiplayer);
});
