import { AggregatorTransformer } from '@canvas/primitives/aggregator/types';
import { CanvasSurface } from '@canvas/surface/types';
import {
  AnnotationsControls,
  StrokeInFlight,
  createStrokeInFlight,
} from '@core/annotations/index';
import { PeerStroke, Point, UserId } from '@multiplayer/protocol/room';

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
 * Who is drawing is read off the room each frame, so a peer who goes takes their stroke
 * with them. What they have drawn is held here instead, in the same {@link StrokeInFlight}
 * the local engine uses: the room's copy is everything the peer has drawn rather than what
 * is still on screen, so a laser rebuilt from it would spring back to full on every packet.
 */
export const usePeerStrokes = ({
  surface,
  multiplayer,
  annotations,
}: PeerStrokeOptions) => {
  const { events, room } = multiplayer;

  const strokes = new Map<UserId, StrokeInFlight>();

  const forget = (peerId: UserId) => strokes.delete(peerId);

  const start = (peerId: UserId, stroke: PeerStroke) =>
    strokes.set(peerId, createStrokeInFlight(stroke));

  const extend = (peerId: UserId, points: Point[]) =>
    strokes.get(peerId)?.extend(points);

  events.subscribe('onPeerStrokeStarted', start);
  events.subscribe('onPeerStrokeExtended', extend);
  events.subscribe('onPeerStrokeEnded', forget);
  events.subscribe('onPeerLeftProduct', forget);

  // the hub belongs to the connection and outlives this product, so a mount that did not
  // clean up would keep answering for a canvas that is gone
  onUnmounted(() => {
    events.unsubscribe('onPeerStrokeStarted', start);
    events.unsubscribe('onPeerStrokeExtended', extend);
    events.unsubscribe('onPeerStrokeEnded', forget);
    events.unsubscribe('onPeerLeftProduct', forget);
  });

  /**
   * adopts whoever was already mid stroke as this client started looking, which no event
   * announces. matched on the stroke id so a `started` that never arrived leaves a stroke
   * to adopt rather than a stale one to keep redrawing.
   */
  const strokeOf = (peerId: UserId, stroke: PeerStroke) => {
    const known = strokes.get(peerId);
    if (known?.id === stroke.id) return known;

    // the drawer's own colour, not their tier's: recolouring at the handoff reads as a jump
    const adopted = createStrokeInFlight(stroke);
    strokes.set(peerId, adopted);
    return adopted;
  };

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

      const element = strokeOf(peerId, stroke).element();
      if (!element) continue;

      // a stroke nobody has committed is not a thing the pointer can land on
      aggregator.push({ ...element, paintOnly: true });
    }

    return aggregator;
  };

  surface.aggregator.addTransformer(peerStrokeElements);
};
