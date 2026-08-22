import { CanvasSurface } from '@canvas/surface/types';

import { onUnmounted } from 'vue';

import { ProductMultiplayer } from './types.ts';
import { jumpUserIdUrl } from './url.ts';

type JumpToUserOptions = {
  surface: CanvasSurface;
  multiplayer: ProductMultiplayer;
};

/**
 * Finishes a jump that had to navigate to get here, which is the whole jump whenever it
 * crossed experiences: the surface it has to move is the one that had not mounted yet.
 *
 * The camera waits on presence landing rather than reading it at mount, since entering
 * the product is a round trip and nobody is in the presence map until it answers. Their
 * camera is read at that point rather than carried along, so it lands where they are
 * looking now instead of where they were when the jump was asked for.
 */
export const useJumpToUser = ({ surface, multiplayer }: JumpToUserOptions) => {
  const userId = jumpUserIdUrl.read();

  // stripped before anything renders, or every link built off this url would carry the
  // jump along and re-run it on arrival
  jumpUserIdUrl.strip();

  if (userId === null) return;

  const land = () => {
    // the first seed is the arrival; a later one is a reconnect, which has no business
    // pulling the camera off wherever the user has since moved it
    multiplayer.events.unsubscribe('onPresenceSeeded', land);

    const room = multiplayer.room.state.value;
    if (!room.connected) return;

    const camera = room.userIdToPresence[userId]?.cameraState;
    if (!camera) return;

    surface.camera.actions.moveTo(camera);
  };

  multiplayer.events.subscribe('onPresenceSeeded', land);

  onUnmounted(() => multiplayer.events.unsubscribe('onPresenceSeeded', land));
};
