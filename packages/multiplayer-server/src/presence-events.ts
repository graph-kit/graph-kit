import { clearDrag, hasDrag, setDrag, setPresence } from './presence.ts';
import { Connection } from './types.ts';

/**
 * What a member is doing right now, one event per signal. All ungated, all high
 * frequency, and all scoped to the product: none of it means anything to somebody
 * looking at something else.
 */
export const registerPresenceEvents = ({
  socket,
  userId,
  presenceTarget,
  relayToProduct,
}: Connection) => {
  socket.on('moveCursor', ({ position }) => {
    const target = presenceTarget();
    if (!target) return;

    setPresence(target.room, target.productId, userId, {
      cursorPosition: position,
    });
    relayToProduct(target.productId, 'cursorMoved', { userId, position });
  });

  socket.on('moveCamera', ({ camera }) => {
    const target = presenceTarget();
    if (!target) return;

    setPresence(target.room, target.productId, userId, {
      cameraState: camera,
    });
    relayToProduct(target.productId, 'cameraMoved', { userId, camera });
  });

  socket.on('setAnnotating', ({ isAnnotating }) => {
    const target = presenceTarget();
    if (!target) return;

    setPresence(target.room, target.productId, userId, { isAnnotating });
    relayToProduct(target.productId, 'annotatingChanged', {
      userId,
      isAnnotating,
    });
  });

  socket.on('startDrag', ({ elements }) => {
    const target = presenceTarget();
    if (!target) return;

    setDrag(target.room, target.productId, userId, elements, Date.now());
    relayToProduct(target.productId, 'dragStarted', { userId, elements });
  });

  socket.on('updateDrag', ({ elements }) => {
    const target = presenceTarget();
    if (!target) return;

    // a move for a drag the room has no record of is one the sweep released early.
    // promoting it back to a start costs peers a blink, where dropping it would leave
    // the elements unheld for the rest of a gesture that is still very much happening
    const reviving = !hasDrag(target.room, target.productId, userId);
    setDrag(target.room, target.productId, userId, elements, Date.now());

    if (reviving) {
      relayToProduct(target.productId, 'dragStarted', { userId, elements });
      return;
    }
    relayToProduct(target.productId, 'dragMoved', { userId, elements });
  });

  socket.on('endDrag', () => {
    const target = presenceTarget();
    if (!target) return;

    clearDrag(target.room, target.productId, userId);
    relayToProduct(target.productId, 'dragEnded', { userId });
  });
};
