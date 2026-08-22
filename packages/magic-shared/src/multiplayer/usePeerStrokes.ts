import { AggregatorTransformer } from '@canvas/primitives/aggregator/types';
import { scribble } from '@canvas/primitives/shapes/scribble/index';
import { CanvasSurface } from '@canvas/surface/types';
import {
  ANNOTATION_IN_PROGRESS_PRIORITY,
  AnnotationsControls,
  laserTrail,
} from '@core/annotations/index';
import { UserId } from '@multiplayer/protocol/room';

import { onUnmounted } from 'vue';

import { ProductMultiplayer } from './types.ts';

type PeerStrokeOptions = {
  surface: CanvasSurface;
  multiplayer: ProductMultiplayer;
  annotations?: AnnotationsControls;
};

/**
 * Paints the stroke every peer is drawing right now, so an annotation shows up as it is
 * made rather than landing whole when it commits, and so a laser shows up at all: it
 * commits to nothing, and this is the only channel it has.
 *
 * Reads presence straight off the room each frame rather than keeping its own copy of it,
 * which is what leaves nothing here to clean up when a peer goes: the connection already
 * drops their entry, and a stroke nobody is listed as drawing is a stroke nobody paints.
 */
export const usePeerStrokes = ({
  surface,
  multiplayer,
  annotations,
}: PeerStrokeOptions) => {
  const { events, room } = multiplayer;

  /**
   * A receiver clock, deliberately not a field on the wire: a laser sends nothing while it
   * holds still, so the trail has to bleed off against time this client can trust rather
   * than against a peer's, which is skewed by however far apart their clocks are.
   */
  const extendedAt = new Map<UserId, number>();

  const touch = (peerId: UserId) => extendedAt.set(peerId, Date.now());
  const forget = (peerId: UserId) => extendedAt.delete(peerId);

  /**
   * whoever was mid stroke as this client arrived, which no event will announce. counted
   * from now rather than from whenever they last moved, which nothing here can know: a
   * laser they are still holding should arrive whole and start decaying, rather than
   * arrive already worn down to a dot
   */
  const adoptSeeded = () => {
    const state = room.state.value;
    if (!state.connected) return;
    for (const [peerId, entry] of Object.entries(state.userIdToPresence)) {
      if (entry.stroke) touch(peerId);
    }
  };

  events.subscribe('onPeerStrokeStarted', touch);
  events.subscribe('onPeerStrokeExtended', touch);
  events.subscribe('onPeerStrokeEnded', forget);
  events.subscribe('onPeerLeftProduct', forget);
  events.subscribe('onPeerEnteredProduct', touch);
  events.subscribe('onPresenceSeeded', adoptSeeded);

  // the hub belongs to the connection and outlives this product, so a mount that did not
  // clean up would keep answering for a canvas that is gone
  onUnmounted(() => {
    events.unsubscribe('onPeerStrokeStarted', touch);
    events.unsubscribe('onPeerStrokeExtended', touch);
    events.unsubscribe('onPeerStrokeEnded', forget);
    events.unsubscribe('onPeerLeftProduct', forget);
    events.unsubscribe('onPeerEnteredProduct', touch);
    events.unsubscribe('onPresenceSeeded', adoptSeeded);
  });

  const peerStrokeElements: AggregatorTransformer = (aggregator) => {
    const state = room.state.value;
    if (!state.connected) return aggregator;

    // the stroke carries the id it commits under, so the annotation that replaces it is
    // recognised by identity rather than by which channel happened to land first
    const committedIds = new Set(
      (annotations?.annotations() ?? []).map(({ id }) => id),
    );

    for (const [peerId, presence] of Object.entries(state.userIdToPresence)) {
      const { stroke } = presence;
      if (!stroke || committedIds.has(stroke.id)) continue;

      const points =
        stroke.mode === 'laser'
          ? laserTrail(
              stroke.points,
              Date.now() - (extendedAt.get(peerId) ?? Date.now()),
            )
          : stroke.points;
      if (points.length === 0) continue;

      aggregator.push({
        id: stroke.id,
        priority: ANNOTATION_IN_PROGRESS_PRIORITY,
        // a stroke nobody has committed is not a thing the pointer can land on, and the
        // peer drawing it is the only one who gets to decide what it becomes
        paintOnly: true,
        shape: scribble({
          type: 'draw',
          points,
          // the drawer's own colour, not their tier's: this is what the stroke commits
          // as, and recolouring it at the handoff would read as a jump
          fillColor: stroke.fillColor,
          brushWeight: stroke.brushWeight,
        }),
      });
    }

    return aggregator;
  };

  surface.aggregator.addTransformer(peerStrokeElements);
};
