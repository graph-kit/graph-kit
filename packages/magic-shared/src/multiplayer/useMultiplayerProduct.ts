import { onMounted, onUnmounted } from 'vue';

// the harness ProductId, a literal union of manifest keys, not the protocol's plain
// string: the server routes by an id it need not enumerate, the client enumerates it
import { ProductId, manifests } from '../product/manifests/index.ts';
import { MultiplayerHostField } from '../product/types.ts';
import { getDisplayName } from './constants.ts';
import { useProvidedMultiplayer } from './context.ts';
import { ProductMultiplayer } from './types.ts';
import { roomIdUrl } from './url.ts';

type MultiplayerProductOptions = {
  productId: ProductId;
  host: MultiplayerHostField;
};

/**
 * Ties the root connection to the mounting product, which is the only place the two
 * meet. Everything a room needs to know about the product is supplied from here, so a
 * caller passes nothing but who is arriving.
 */
export const useMultiplayerProduct = ({
  productId,
  host,
}: MultiplayerProductOptions): ProductMultiplayer | undefined => {
  const multiplayer = useProvidedMultiplayer();

  // opting in is per product and explicit. a product that has not declared itself
  // multiplayer never registers, so nothing can be routed to it even if the server
  // were to try
  if (!manifests[productId].multiplayer || !multiplayer) return undefined;

  const { actions, room, awaitingServerState } = multiplayer;
  const binding = { productId, host };

  onMounted(async () => {
    // ahead of the url, which still names the room this connection is already in:
    // mounting inside one is a navigation, and rejoining would arrive as a new member
    if (room.value.connected) {
      await actions.product.enter(binding);
      return;
    }

    const targetRoomId = roomIdUrl.read();
    if (!targetRoomId) return;

    // no name to hand over yet: the panel that owns it has not mounted, so the room
    // holds the placeholder until it renames through room.controls
    const result = await actions.room.join({
      ...binding,
      roomId: targetRoomId,
      displayName: getDisplayName(),
    });

    // a dead room id is a non event: strip it and carry on exactly as if the param had
    // never been there, with no error surfaced
    if (!result.joined) roomIdUrl.strip();
  });

  onUnmounted(() => actions.product.leave(productId));

  return {
    room: {
      state: room,
      start: ({ displayName }) =>
        actions.room.start({ ...binding, displayName }),
      join: ({ roomId, displayName }) =>
        actions.room.join({ ...binding, roomId, displayName }),
      leave: actions.room.leave,
    },
    awaitingServerState,
  };
};
