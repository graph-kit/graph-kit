import { onUnmounted } from 'vue';

// the harness ProductId, a literal union of manifest keys, not the protocol's plain
// string: the server routes by an id it need not enumerate, the client enumerates it
import { ProductId, manifests } from '../product/manifests/index.ts';
import { useProvidedMultiplayer } from './context.ts';

/**
 * Hands a mounting product the root connection, and releases it on unmount. The
 * connection, the room and the roster all outlive this, which is the whole reason none
 * of them live on the harness.
 *
 * Registering is deliberately not done here: the harness calls enterProduct itself,
 * because it has to know whether a room answered before deciding to restore from local
 * storage, and that ordering is the harness's to own.
 */
export const useMultiplayerProduct = (
  productId: ProductId,
  host: unknown,
) => {
  const multiplayer = useProvidedMultiplayer();

  // opting in is per product and explicit. a product that has not declared itself
  // multiplayer never registers, so nothing can be routed to it even if the server
  // were to try
  if (!manifests[productId].multiplayer) return undefined;
  if (!multiplayer) return undefined;
  if (!host) return undefined;

  onUnmounted(() => multiplayer.leaveProduct(productId));

  return multiplayer;
};
