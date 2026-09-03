import { GEdge, GNode } from '@magic/shared/graph';

/**
 * every frame carries the whole picture rather than a delta, so the playhead can
 * land anywhere without replaying what came before it
 */
type DfsPayload = {
  visitedNodeIds?: readonly GNode['id'][];
  exploredNode?: GNode['id'];
  /** on the stack but not explored yet, top of the stack last */
  stackNodeIds?: readonly GNode['id'][];
  traveledEdgeIds?: readonly GEdge['id'][];
  /** the one edge whose far end the current frame is deciding on */
  activeEdgeId?: GEdge['id'];
};

export type DfsFrame = (
  | { type: 'start'; node: GNode['id'] }
  | { type: 'end' }
  | { type: 'explore-node' }
  | { type: 'travel-edge'; node: GNode['id'] }
  | { type: 'push-node'; node: GNode['id'] }
  | { type: 'mark-visited'; node: GNode['id'] }
  | { type: 'previously-visited'; node: GNode['id'] }
  | { type: 'popped-node-already-visited'; node: GNode['id'] }
) &
  DfsPayload;
