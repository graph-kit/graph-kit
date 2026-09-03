import { encodeProductDoc } from './documents.ts';
import { setMemberProduct } from './roster.ts';
import { Connection } from './types.ts';

/**
 * Which product a member is on, which is what scopes the other two. Entering answers with
 * everything that product holds, so nothing has to be waited for.
 */
export const registerProductEvents = ({
  socket,
  userId,
  room,
  productId,
  enterProduct,
  leaveProduct,
  peerPresence,
  broadcastRoster,
}: Connection) => {
  socket.on('enterProduct', ({ productId: target }, callback) => {
    const current = room();
    // the same quiet answer syncDoc gives, since either way there is nothing to apply
    if (!current) return callback({ doc: null, presence: {} });
    if (!enterProduct(target)) return callback({ doc: null, presence: {} });

    setMemberProduct(current, userId(), target);
    callback({
      doc: encodeProductDoc(current, target),
      // read after entering, so a peer who left as this call landed is already gone
      presence: peerPresence(current, target),
    });
    broadcastRoster(current);
  });

  socket.on('leaveProduct', ({ productId: target }) => {
    if (productId() !== target) return;
    leaveProduct(target);
  });
};
