import { debounce } from '@core/utils/debounce';
import { PatchOp } from '@multiplayer/protocol/server-state';

import { onUnmounted } from 'vue';

import { Graph } from '../graph/types.ts';
import { MultiplayerControls } from '../multiplayer/createMultiplayer.ts';
import { ProductId } from '../product/manifests/index.ts';
import {
  encodeElementsAdded,
  encodeElementsRemoved,
  encodePositionsCommitted,
  encodeWeightsChanged,
} from './server-state-ops.ts';

/** long enough that a burst of edits verifies once, short enough to catch drift fast */
const DRIFT_CHECK_DELAY_MS = 1000;

/** subscription driven, since provenance only holds while graph events emit synchronously */
export const useGraphOutboundSync = (
  graph: Graph,
  productId: ProductId,
  multiplayer: MultiplayerControls,
): void => {
  const verifyNoDrift = debounce(() => {
    multiplayer.resyncIfDrifted(productId);
  }, DRIFT_CHECK_DELAY_MS);

  const send = (ops: PatchOp[]) => {
    multiplayer.sendOps(productId, ops);
    verifyNoDrift();
  };

  // subscribed at the action boundary, so removing a node and its dangling edges stays
  // one message the receiver derives the rest from
  graph.events.subscribe('onElementsAdded', (added) => {
    send(encodeElementsAdded(graph, added));
  });

  graph.events.subscribe('onElementsRemoved', (removed) => {
    send(encodeElementsRemoved(removed));
  });

  // the settled move rather than onNodeMoveStream, which would send one message per frame
  graph.events.subscribe('onNodePositionsCommitted', (positions) => {
    send(encodePositionsCommitted(positions));
  });

  graph.events.subscribe('onEdgeWeightsChanged', (weights) => {
    send(encodeWeightsChanged(weights));
  });

  // an undo, a link load or our own resync; provenance keeps the last from bouncing back
  graph.events.transit.subscribe('onDecoded', () => {
    multiplayer.sendReplacement(productId);
    verifyNoDrift();
  });

  // a pending check would otherwise encode a graph that is being torn down
  onUnmounted(verifyNoDrift.cancel);
};
