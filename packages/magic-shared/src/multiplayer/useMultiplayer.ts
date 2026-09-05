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
  product: ProductControls;
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
  product,
  productId,
  componentSlots,
}: MultiplayerOptions): MultiplayerSetup => {
  const { binding, controls } = useDocBinding(product);

  const multiplayer = useMultiplayerProduct({
    productId,
    controls,
    componentSlots,
  });

  usePeerDrags({ binding, multiplayer, surface: product.surface });

  if (multiplayer) {
    usePresenceBroadcast({
      surface: product.surface,
      multiplayer,
      controls: product.multiplayer,
      annotations: product.annotations,
    });

    useSuspendedContent({
      surface: product.surface,
      events: multiplayer.events,
    });

    useJumpToUser({ surface: product.surface, multiplayer });

    usePeerNameTags({ surface: product.surface, multiplayer });

    usePeerStrokes({
      surface: product.surface,
      multiplayer,
      annotations: product.annotations,
    });
  }

  return {
    product: multiplayer,
    roomHistory: computed(() => binding.value?.history),
  };
};
