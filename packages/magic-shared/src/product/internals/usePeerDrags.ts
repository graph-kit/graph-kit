import { DraggedElement, UserId } from '@multiplayer/protocol/room';

import { watch } from 'vue';

import { ProductMultiplayer } from '../../multiplayer/types.ts';
import { ProductHostBinding } from './useHostBinding.ts';

type PeerDragOptions = {
  binding: ProductHostBinding['binding'];
  multiplayer: ProductMultiplayer | undefined;
};

/**
 * Hands the host what every peer is moving right now, so a drag shows up as it happens
 * rather than landing all at once when it commits.
 */
export const usePeerDrags = ({ binding, multiplayer }: PeerDragOptions) => {
  if (!multiplayer) return;

  const peerDrags = (): Record<UserId, DraggedElement[]> => {
    const room = multiplayer.room.state.value;
    if (!room.connected) return {};

    const drags: Record<UserId, DraggedElement[]> = {};
    for (const [userId, entry] of Object.entries(room.userIdToPresence)) {
      // this client is the one authoring its own drag, and applying it back would
      // fight the drag plugin for the same nodes
      if (userId === room.me.id) continue;
      if (entry.draggedElements.length > 0) {
        drags[userId] = entry.draggedElements;
      }
    }
    return drags;
  };

  // deep because presence lands by writing into the record rather than replacing it
  watch(peerDrags, (drags) => binding.value?.applyPeerDrags(drags), {
    deep: true,
  });
};
