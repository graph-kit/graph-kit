import {
  clearDrag,
  clearStroke,
  extendStroke,
  hasDrag,
  setDrag,
  setPresence,
  setStroke,
} from './presence.ts';
import { Connection } from './types.ts';

/**
 * What a member is doing right now, one event per signal. All ungated, all high
 * frequency, and all scoped to the product: none of it means anything to somebody
 * looking at something else.
 */
export const registerPresenceEvents = ({
  socket,
  presenceTarget,
  relayToProduct,
}: Connection) => {
  socket.on('moveCursor', ({ position }) => {
    const target = presenceTarget();
    if (!target) return;
    const { userId } = target;

    setPresence(target.room, target.productId, userId, {
      cursorPosition: position,
    });
    relayToProduct(target.productId, 'cursorMoved', { userId, position });
  });

  socket.on('moveCamera', ({ camera }) => {
    const target = presenceTarget();
    if (!target) return;
    const { userId } = target;

    setPresence(target.room, target.productId, userId, {
      cameraState: camera,
    });
    relayToProduct(target.productId, 'cameraMoved', { userId, camera });
  });

  socket.on('setAnnotating', ({ isAnnotating }) => {
    const target = presenceTarget();
    if (!target) return;
    const { userId } = target;

    setPresence(target.room, target.productId, userId, { isAnnotating });
    relayToProduct(target.productId, 'annotatingChanged', {
      userId,
      isAnnotating,
    });
  });

  socket.on('startDrag', ({ elements }) => {
    const target = presenceTarget();
    if (!target) return;
    const { userId } = target;

    setDrag(target.room, target.productId, userId, elements, Date.now());
    relayToProduct(target.productId, 'dragStarted', { userId, elements });
  });

  socket.on('updateDrag', ({ elements }) => {
    const target = presenceTarget();
    if (!target) return;
    const { userId } = target;

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
    const { userId } = target;

    clearDrag(target.room, target.productId, userId);
    relayToProduct(target.productId, 'dragEnded', { userId });
  });

  /**
   * A stroke is not swept for staleness the way a drag is. A drag held by somebody who
   * vanished keeps their nodes out of everyone else's reach, so it is worth releasing
   * early on a guess; a stroke is paint and blocks nothing, and every real departure
   * already clears it through `clearPresence`. Sweeping one would also kill the ordinary
   * case of a laser held still on the thing being talked about, which sends nothing for
   * as long as it is held and has no delta to be revived by.
   */
  socket.on('startStroke', ({ stroke }) => {
    const target = presenceTarget();
    if (!target) return;
    const { userId } = target;

    const kept = setStroke(target.room, target.productId, userId, stroke);
    relayToProduct(target.productId, 'strokeStarted', { userId, stroke: kept });
  });

  socket.on('extendStroke', ({ points }) => {
    const target = presenceTarget();
    if (!target) return;
    const { userId } = target;

    // a delta for a stroke the room has no record of is dropped rather than revived: it
    // names no id, colour or weight, so there is nothing to paint it as
    const extended = extendStroke(
      target.room,
      target.productId,
      userId,
      points,
    );
    if (!extended) return;

    relayToProduct(target.productId, 'strokeExtended', { userId, points });
  });

  socket.on('endStroke', () => {
    const target = presenceTarget();
    if (!target) return;
    const { userId } = target;

    clearStroke(target.room, target.productId, userId);
    relayToProduct(target.productId, 'strokeEnded', { userId });
  });
};
