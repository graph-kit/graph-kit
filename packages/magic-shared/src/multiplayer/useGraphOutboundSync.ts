import { debounce } from '@core/utils/debounce';
import { hashServerState } from '@multiplayer/protocol/server-state';

import { onUnmounted } from 'vue';

import { Graph } from '../graph/types.ts';
import { ProductId } from '../product/manifests/index.ts';
import {
  encodeElementsAdded,
  encodeElementsRemoved,
  encodePositionsCommitted,
  encodeWeightsChanged,
} from '../product/server-state-ops.ts';
import { serverStateFromTransit } from '../product/server-state.ts';
import { MultiplayerControls } from './createMultiplayer.ts';

/** long enough that a burst of edits verifies once, short enough to catch drift fast */
const DRIFT_CHECK_DELAY = 1000;

/**
 * Subscribes the four events that compile to ops and sends what they produce.
 *
 * Subscription driven on purpose, never watcher driven. Provenance is a re-entrancy
 * flag on the singleton, which is only sound because graph events emit synchronously
 * inside the mutation's own stack frame. A watcher flushes on a microtask, by which
 * point the flag has cleared and every applied remote change echoes straight back out.
 */
export const useGraphOutboundSync = (
  graph: Graph,
  productId: ProductId,
  multiplayer: MultiplayerControls,
) => {
  /**
   * Recomputing the local hash means a whole encode, so it runs on a debounce rather
   * than per message. Drift does not need sub second detection, and doing this on every
   * inbound relay would reintroduce exactly the per message whole graph cost that ruled
   * out syncing wholesale state in the first place.
   */
  // the debounce has no cancel, so a timer scheduled just before unmount would encode
  // a graph that is being torn down
  let mounted = true;

  const verifyNoDrift = debounce(() => {
    if (!mounted) return;
    const localHash = hashServerState(
      serverStateFromTransit(graph.transit.encode()),
    );
    multiplayer.reportLocalHash(productId, localHash);
  }, DRIFT_CHECK_DELAY);

  const send = (ops: ReturnType<typeof encodeElementsRemoved>) => {
    multiplayer.sendOps(productId, ops);
    verifyNoDrift();
  };

  // subscribed at the action boundary rather than per element type: one action that
  // removes a node and its dangling edges is one message, so the receiver applies it
  // as one call and derives the same consequence internally instead of being told twice
  graph.events.subscribe('onElementsAdded', (added) => {
    send(encodeElementsAdded(graph, added as never));
  });

  graph.events.subscribe('onElementsRemoved', (removed) => {
    send(encodeElementsRemoved(removed as never));
  });

  // the settled move, never the per frame stream: dragging emits onNodeMoveStream on
  // every frame, and broadcasting that would put a message on the wire per pointer event
  graph.events.subscribe('onNodePositionsCommitted', (positions) => {
    send(encodePositionsCommitted(positions as never));
  });

  graph.events.subscribe('onEdgeWeightsChanged', (weights) => {
    send(encodeWeightsChanged(weights as never));
  });

  /**
   * Undo restores a snapshot rather than replaying an inverse, so there is no op to
   * send. It goes out as a wholesale override, which clobbers whatever landed since the
   * snapshot was taken, consistent with the room's last-write-wins policy everywhere
   * else.
   */
  const pushWholeState = () => {
    multiplayer.sendReplacement(
      productId,
      serverStateFromTransit(graph.transit.encode()),
    );
  };

  graph.events.transit.subscribe('onDecoded', () => {
    // a decode is either an undo, a link load or our own resync. the last of those is
    // already the room's state, and the provenance flag keeps it from bouncing back
    pushWholeState();
    verifyNoDrift();
  });

  onUnmounted(() => {
    mounted = false;
  });

  return { pushWholeState };
};
