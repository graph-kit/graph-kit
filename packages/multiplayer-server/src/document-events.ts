import { applyProductDocUpdate, encodeProductDocDiff } from './documents.ts';
import { canWriteProduct } from './roster.ts';
import { Connection } from './types.ts';

/** the state everyone on a product shares, merged into the room's copy and relayed on */
export const registerDocumentEvents = ({
  socket,
  userId,
  room,
  relayToProduct,
}: Connection) => {
  socket.on('docUpdate', ({ productId, update }) => {
    const current = room();
    if (!current || !canWriteProduct(current, userId())) return;

    applyProductDocUpdate(current, productId, update);
    relayToProduct(productId, 'docUpdated', { productId, update });
  });

  // answered with the difference rather than whole state, so a reconnect costs the diff
  socket.on('syncDoc', ({ productId, stateVector }, callback) => {
    const current = room();
    if (!current) return callback(null);
    callback(encodeProductDocDiff(current, productId, stateVector));
  });
};
