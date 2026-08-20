import { onMounted, onUnmounted } from 'vue';

// the harness ProductId, a literal union of manifest keys, not the protocol's plain
// string: the server routes by an id it need not enumerate, the client enumerates it
import { ComponentSlotControls } from '../component-slot/useComponentSlotsState.ts';
import { ProductId, manifests } from '../product/manifests/index.ts';
import { MultiplayerHostField } from '../product/types.ts';
import { useRosterPanel } from '../ui/multiplayer/useRosterPanel.ts';
import { useProvidedMultiplayer } from './context.ts';
import { ProductMultiplayer } from './types.ts';
import { roomIdUrl } from './url.ts';

type MultiplayerProductOptions = {
  productId: ProductId;
  host: MultiplayerHostField;
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

  onMounted(async () => {
    if (room.value.connected) {
      await actions.product.enter(binding);
      return;
    }

    const targetRoomId = roomIdUrl.read();
    if (!targetRoomId) return;

    try {
      await actions.room.join({ ...binding, roomId: targetRoomId });
    } catch (err) {
      console.warn('multiplayer: could not reach the room to join it', err);
    }
  });

  onUnmounted(() => actions.product.leave(productId));

  return {
    room: {
      state: room,
      start: () => actions.room.start(binding),
      join: ({ roomId }) => actions.room.join({ ...binding, roomId }),
      leave: actions.room.leave,
    },
    events,
    ui: {
      rosterPanel: useRosterPanel({ room, events, componentSlots }),
    },
  };
};
