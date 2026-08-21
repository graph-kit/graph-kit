import { AggregatorTransformer } from '@canvas/primitives/aggregator/types';
import { CanvasSurface } from '@canvas/surface/types';
import { DraggedElement, UserId } from '@multiplayer/protocol/room';

import { watch } from 'vue';

import { ProductMultiplayer } from './types.ts';
import { ProductHostBinding } from './useHostBinding.ts';

type PeerDragOptions = {
  binding: ProductHostBinding['binding'];
  multiplayer: ProductMultiplayer | undefined;
  surface: CanvasSurface;
};

/**
 * Hands the host what every peer is moving right now, so a drag shows up as it happens
 * rather than landing all at once when it commits.
 */
export const usePeerDrags = ({
  binding,
  multiplayer,
  surface,
}: PeerDragOptions) => {
  if (!multiplayer) return;

  const peerDrags = (): Record<UserId, DraggedElement[]> => {
    const room = multiplayer.room.state.value;
    if (!room.connected) return {};

    const drags: Record<UserId, DraggedElement[]> = {};
    for (const [userId, entry] of Object.entries(room.userIdToPresence)) {
      if (userId === room.me.id) continue;
      if (entry.draggedElements.length > 0) {
        drags[userId] = entry.draggedElements;
      }
    }
    return drags;
  };

  const peerHeldIds = () => {
    const ids = new Set<string>();
    for (const elements of Object.values(peerDrags())) {
      for (const { id } of elements) ids.add(id);
    }
    return ids;
  };

  // deep because presence lands by writing into the record rather than replacing it
  watch(peerDrags, (drags) => binding.value?.applyPeerDrags(drags), {
    deep: true,
  });

  // paint only keeps a peer's element on screen while taking it out of hit testing, so
  // nobody here can grab it out from under them mid drag
  const markPeerHeldElements: AggregatorTransformer = (aggregator) => {
    const held = peerHeldIds();
    if (held.size === 0) return aggregator;
    for (const element of aggregator) {
      if (held.has(element.id)) element.paintOnly = true;
    }
    return aggregator;
  };

  surface.aggregator.transformers.push(markPeerHeldElements);
};
