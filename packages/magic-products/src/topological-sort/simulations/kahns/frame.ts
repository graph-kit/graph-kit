import { GEdge, GNode } from '@magic/shared/graph';

export type KahnsStep =
  | { type: 'count-in-degrees' }
  | { type: 'enqueue-sources' }
  | { type: 'place-node'; node: GNode['id'] }
  | { type: 'remove-edge'; edge: GEdge['id']; node: GNode['id'] }
  | { type: 'enqueue-node'; edge: GEdge['id']; node: GNode['id'] }
  | { type: 'end'; stuckNodeIds: readonly GNode['id'][] };

type KahnsState = {
  inDegrees: Readonly<Record<GNode['id'], number>>;
  queuedNodeIds: readonly GNode['id'][];
  orderedNodeIds: readonly GNode['id'][];
  removedEdgeIds: readonly GEdge['id'][];
  // the node whose outgoing edges are being removed
  placedNodeId?: GNode['id'];
};

export type KahnsFrame = KahnsStep & KahnsState;
