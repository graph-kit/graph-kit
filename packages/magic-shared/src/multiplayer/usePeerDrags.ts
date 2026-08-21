import { AggregatorTransformer } from '@canvas/primitives/aggregator/types';
import { CanvasSurface } from '@canvas/surface/types';
import { DraggedElement, UserId } from '@multiplayer/protocol/room';

import { onUnmounted } from 'vue';

import { ProductMultiplayer } from './types.ts';
import { ProductHostBinding } from './useHostBinding.ts';

type PeerDragOptions = {
  binding: ProductHostBinding['binding'];
  multiplayer: ProductMultiplayer | undefined;
  surface: CanvasSurface;
};

/**
 * Hands the host what every peer is moving right now, so a drag shows up as it happens
 * rather than landing all at once when it commits, and keeps what they are holding out
 * of this user's reach for as long as they have it.
 */
export const usePeerDrags = ({
  binding,
  multiplayer,
  surface,
}: PeerDragOptions) => {
  if (!multiplayer) return;

  const { events, room } = multiplayer;

  /**
   * Held by user rather than as one flat set, because releasing one peer must not
   * release an element another peer also has hold of, and because a peer leaving names
   * only itself. Start and end set and clear outright, never assuming a matched pair:
   * a drag the room released early is revived with a second start.
   */
  const heldByPeer = new Map<UserId, string[]>();

  /**
   * Flattened for the transformer, which runs every frame and should not be walking a
   * map of peers to do it. Rebuilt only when a drag begins or ends, which is the whole
   * reason these are events rather than a diff.
   */
  let heldIds = new Set<string>();

  const rebuildHeldIds = () => {
    heldIds = new Set(
      [...heldByPeer.values()].flatMap((elementIds) => elementIds),
    );
  };

  const hold = (peerId: UserId, elements: DraggedElement[]) => {
    heldByPeer.set(
      peerId,
      elements.map(({ id }) => id),
    );
    rebuildHeldIds();
  };

  const release = (peerId: UserId) => {
    heldByPeer.delete(peerId);
    rebuildHeldIds();
    binding.value?.endPeerDrag(peerId);
  };

  const move = (peerId: UserId, elements: DraggedElement[]) => {
    hold(peerId, elements);
    binding.value?.applyPeerDrag(peerId, elements);
  };

  /** whoever was mid drag as this client arrived, which no event will announce */
  const adoptSeeded = () => {
    const state = room.state.value;
    if (!state.connected) return;
    for (const [peerId, entry] of Object.entries(state.userIdToPresence)) {
      if (entry.drag) move(peerId, entry.drag);
    }
  };

  events.subscribe('onPeerDragStarted', move);
  events.subscribe('onPeerDragMoved', move);
  events.subscribe('onPeerDragEnded', release);
  events.subscribe('onPeerLeftProduct', release);
  events.subscribe('onPresenceSeeded', adoptSeeded);

  // the hub belongs to the connection and outlives this product, so a mount that did not
  // clean up would keep answering for a graph that is gone
  onUnmounted(() => {
    events.unsubscribe('onPeerDragStarted', move);
    events.unsubscribe('onPeerDragMoved', move);
    events.unsubscribe('onPeerDragEnded', release);
    events.unsubscribe('onPeerLeftProduct', release);
    events.unsubscribe('onPresenceSeeded', adoptSeeded);
  });

  // paint only keeps a peer's element on screen while taking it out of hit testing, so
  // nobody here can grab it out from under them mid drag
  const markPeerHeldElements: AggregatorTransformer = (aggregator) => {
    if (heldIds.size === 0) return aggregator;
    for (const element of aggregator) {
      if (heldIds.has(element.id)) element.paintOnly = true;
    }
    return aggregator;
  };

  surface.aggregator.transformers.push(markPeerHeldElements);
};
