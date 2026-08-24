import { ComputedRef, computed } from 'vue';

import { ComponentSlotControls } from '../component-slot/useComponentSlotsState.ts';
import { ProductId } from '../product/manifests/index.ts';
import { HistoryField, ProductControls } from '../product/types.ts';
import { ProductMultiplayer } from './types.ts';
import { useDocBinding } from './useDocBinding.ts';
import { useJumpToUser } from './useJumpToUser.ts';
import { useMultiplayerProduct } from './useMultiplayerProduct.ts';
import { usePeerDrags } from './usePeerDrags.ts';
import { usePeerNameTags } from './usePeerNameTags.ts';
import { usePeerStrokes } from './usePeerStrokes.ts';
import { usePresenceBroadcast } from './usePresenceBroadcast.ts';
import { useSuspendedContent } from './useSuspendedContent.ts';

type MultiplayerOptions = {
  host: ProductControls;
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
  const { binding, multiplayer } = useDocBinding(host);

  const product = useMultiplayerProduct({
    productId,
    host: multiplayer,
    componentSlots,
  });

  usePeerDrags({ binding, multiplayer: product, surface: host.surface });

  if (product) {
    usePresenceBroadcast({
      surface: host.surface,
      multiplayer: product,
      host: host.multiplayer,
      annotations: host.annotations,
    });

    useSuspendedContent({ surface: host.surface, events: product.events });

    useJumpToUser({ surface: host.surface, multiplayer: product });

    usePeerNameTags({ surface: host.surface, multiplayer: product });

    usePeerStrokes({
      surface: host.surface,
      multiplayer: product,
      annotations: host.annotations,
    });
  }

  return {
    product,
    roomHistory: computed(() => binding.value?.history),
  };
};
