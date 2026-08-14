import { debounce } from '@core/utils/debounce';
import { PatchOp, hashServerState } from '@multiplayer/protocol/server-state';

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

export type GraphOutboundSync = {
  /** behind undo and suspend-exit, neither of which can be expressed as an op */
  pushWholeState: () => void;
};

/** long enough that a burst of edits verifies once, short enough to catch drift fast */
const DRIFT_CHECK_DELAY = 1000;

/**
 * Subscribes the four events that compile to ops. Subscription driven, never watcher
 * driven: provenance is a re-entrancy flag that only holds because graph events emit
 * synchronously, and a watcher would flush after it cleared.
 */
export const useGraphOutboundSync = (
  graph: Graph,
  productId: ProductId,
  multiplayer: MultiplayerControls,
): GraphOutboundSync => {
  // the debounce has no cancel, so a timer scheduled just before unmount would encode
  // a graph that is being torn down
  let mounted = true;

  // debounced because recomputing means a whole encode, and drift does not need
  // sub second detection

  const verifyNoDrift = debounce(() => {
    if (!mounted) return;
    const localHash = hashServerState(
      serverStateFromTransit(graph.transit.encode()),
    );
    multiplayer.reportLocalHash(productId, localHash);
  }, DRIFT_CHECK_DELAY);

  const send = (ops: PatchOp[]): void => {
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

  // undo restores a snapshot rather than an inverse, so there is no op to send
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
