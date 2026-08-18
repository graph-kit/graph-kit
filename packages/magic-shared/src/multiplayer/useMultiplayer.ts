import { ComputedRef, computed } from 'vue';

import { ComponentSlotControls } from '../component-slot/useComponentSlotsState.ts';
import { ProductId } from '../product/manifests/index.ts';
import { HistoryField, MagicProductHost } from '../product/types.ts';
import { ProductMultiplayer } from './types.ts';
import { useHostBinding } from './useHostBinding.ts';
import { useJumpToUser } from './useJumpToUser.ts';
import { useMultiplayerProduct } from './useMultiplayerProduct.ts';
import { usePeerDrags } from './usePeerDrags.ts';
import { usePresenceBroadcast } from './usePresenceBroadcast.ts';
import { useSuspendedContent } from './useSuspendedContent.ts';

type MultiplayerOptions = {
  host: MagicProductHost;
  productId: ProductId;
  componentSlots: ComponentSlotControls;
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
  componentSlots,
}: MultiplayerOptions): MultiplayerSetup => {
  const { binding, multiplayerHost } = useHostBinding(host);

  const product = useMultiplayerProduct({
    productId,
    host: multiplayerHost,
    componentSlots,
  });

  usePeerDrags({ binding, multiplayer: product });

  // the surface is all presence needs, so every host broadcasts it rather than only the
  // ones backed by a graph
  if (product) {
    usePresenceBroadcast({
      surface: host.surface,
      productId,
      multiplayer: product,
      host: host.multiplayer,
      annotations: host.annotations,
    });

    useSuspendedContent({ surface: host.surface, events: product.events });

    useJumpToUser({ surface: host.surface, multiplayer: product });
  }

  return {
    product,
    roomHistory: computed(() => binding.value?.history),
  };
};
