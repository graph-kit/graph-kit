import { PRODUCT_WRITE_FLOOR, meetsFloor } from '@multiplayer/protocol/tiers';

import { computed, onMounted, onUnmounted } from 'vue';

import { ComponentSlotControls } from '../component-slot/useComponentSlotsState.ts';
import { ProductId, manifests } from '../product/manifests/index.ts';
import { MultiplayerControls } from '../product/types.ts';
import { useJoinSessionBanner } from '../ui/multiplayer/useJoinSessionBanner.ts';
import { useRosterPanel } from '../ui/multiplayer/useRosterPanel.ts';
import { useProvidedMultiplayer } from './context.ts';
import { joinAndFollowHost } from './joinAndFollowHost.ts';
import { ProductMultiplayer } from './types.ts';
import { roomIdUrl } from './url.ts';
import { useTierBehavior } from './useTierBehavior.ts';

type MultiplayerProductOptions = {
  productId: ProductId;
  host: MultiplayerControls;
  componentSlots: ComponentSlotControls;
};

/**
 * Ties the root connection to the mounting product, which is the only place the two
 * meet. Everything a room needs to know about the product is supplied from here, so a
 * caller passes nothing but who is arriving.
 */
export const useMultiplayerProduct = ({
  productId,
  host,
  componentSlots,
}: MultiplayerProductOptions): ProductMultiplayer | undefined => {
  const multiplayer = useProvidedMultiplayer();

  // opting in is per product and explicit. a product that has not declared itself
  // multiplayer never registers, so nothing can be routed to it even if the server
  // were to try
  if (!manifests[productId].multiplayer || !multiplayer) {
    onMounted(roomIdUrl.strip);
    return undefined;
  }

  const { actions, room, events } = multiplayer;
  const binding = { productId, host };

  useTierBehavior({ room, tiers: host.tiers });

  onMounted(async () => {
    if (room.value.connected) {
      await actions.product.enter(binding);
      return;
    }

    const targetRoomId = roomIdUrl.read();
    if (!targetRoomId) return;

    try {
      const joinRoomResult = await actions.room.join({ roomId: targetRoomId });
      if (joinRoomResult.joined) await actions.product.enter(binding);
    } catch (err) {
      console.warn('multiplayer: could not reach the room to join it', err);
    }
  });

  onUnmounted(() => actions.product.leave(productId));

  const isReadonly = computed(
    () =>
      room.value.connected &&
      !meetsFloor(room.value.me.tier, PRODUCT_WRITE_FLOOR),
  );

  return {
    room: {
      state: room,
      start: () => actions.room.start(binding),
      join: ({ roomId }) => joinAndFollowHost({ actions, binding, roomId }),
      leave: actions.room.leave,
      isReadonly,
    },
    events,
    ui: {
      rosterPanel: useRosterPanel({ room, events, componentSlots }),
      joinBanner: useJoinSessionBanner({ componentSlots, events }),
    },
  };
};
