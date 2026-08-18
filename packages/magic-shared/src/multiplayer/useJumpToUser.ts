import { CanvasSurface } from '@canvas/surface/types';
import { UserId } from '@multiplayer/protocol/room';

import { onMounted } from 'vue';

import { ProductMultiplayer } from './types.ts';

/**
 * A jump at someone in another experience outlives the click that started it, since the
 * surface it has to move is the one that has not mounted yet. Module scope because the
 * navigation in between unmounts anything narrower.
 */
let pendingUserId: UserId | null = null;

/** for a jump that has to navigate first, claimed by the experience it lands on */
export const requestJump = (userId: UserId) => {
  pendingUserId = userId;
};

type JumpToUserOptions = {
  surface: CanvasSurface;
  multiplayer: ProductMultiplayer;
};

/**
 * Finishes a jump that had to navigate to get here. Their presence is read on arrival
 * rather than carried along, so the camera lands where they are looking now instead of
 * where they were when the jump was asked for.
 */
export const useJumpToUser = ({ surface, multiplayer }: JumpToUserOptions) => {
  onMounted(() => {
    const userId = pendingUserId;
    pendingUserId = null;
    if (userId === null) return;

    const room = multiplayer.room.state.value;
    if (!room.connected) return;

    const camera = room.userIdToPresence[userId]?.cameraState;
    if (!camera) return;

    surface.camera.actions.moveTo(camera);
  });
};
