import { ComputedRef, computed } from 'vue';

import { ProductId } from '../product/manifests/index.ts';
import { HistoryField, MagicProductHost } from '../product/types.ts';
import { ProductMultiplayer } from './types.ts';
import { useHostBinding } from './useHostBinding.ts';
import { useMultiplayerProduct } from './useMultiplayerProduct.ts';
import { usePeerDrags } from './usePeerDrags.ts';
import { usePresenceBroadcast } from './usePresenceBroadcast.ts';

type MultiplayerOptions = {
  host: MagicProductHost;
  productId: ProductId;
};

export type MultiplayerSetup = {
  product: ProductMultiplayer | undefined;
  /** undo over the room's copy of the product, once a room owns it */
  roomHistory: ComputedRef<HistoryField | undefined>;
};

/** everything a mounting product needs from the room, wired in one call */
export const useMultiplayer = ({
  host,
  productId,
}: MultiplayerOptions): MultiplayerSetup => {
  const { binding, multiplayerHost } = useHostBinding(host);

  const product = useMultiplayerProduct({ productId, host: multiplayerHost });

  usePeerDrags({ binding, multiplayer: product });

  // the surface is all presence needs, so every host broadcasts it rather than only the
  // ones backed by a graph
  if (product) {
    usePresenceBroadcast({
      surface: host.surface,
      productId,
      multiplayer: product,
      host: host.multiplayer,
    });
  }

  return {
    product,
    roomHistory: computed(() => binding.value?.history),
  };
};
