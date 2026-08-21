import { productChannel } from './channels.ts';
import { expireStaleDrags } from './presence.ts';
import { ServerContext } from './types.ts';

/**
 * Above any pause a real gesture takes, and well under the twenty seconds a ping timeout
 * would leave nodes held for. A drag released early is revived by its owner's next move.
 */
const DRAG_STALE_MS = 5_000;
const DRAG_SWEEP_INTERVAL_MS = 1_000;

/** overridable so a test can watch a drag go stale without waiting out a real one */
export type DragSweepOptions = {
  staleAfterMs?: number;
  sweepIntervalMs?: number;
};

/** io rather than a relay: no socket is behind an expiry, and the owner should hear it */
export const startDragSweep = (
  { io, rooms }: ServerContext,
  options: DragSweepOptions = {},
) => {
  const staleAfterMs = options.staleAfterMs ?? DRAG_STALE_MS;

  const sweep = () => {
    const now = Date.now();
    for (const [roomId, room] of rooms.entries()) {
      for (const { productId, userId } of expireStaleDrags(
        room,
        now,
        staleAfterMs,
      )) {
        io.to(productChannel(roomId, productId)).emit('dragEnded', { userId });
      }
    }
  };

  // unref'd: sweeping is never a reason for the process to stay alive
  setInterval(sweep, options.sweepIntervalMs ?? DRAG_SWEEP_INTERVAL_MS).unref();
};
