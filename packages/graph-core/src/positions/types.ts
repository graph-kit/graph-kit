import { MaybeGetter } from '@core/utils/maybeGetter/index';
import { CoreNode, Position } from '@graph/primitives/types';

import type { NodePositionStoreEventMap } from './events.ts';

export type { Position };

export type NodePositionEntry = {
  nodeId: CoreNode['id'];
  position: Position;
};

export type NodePositionUpdate = {
  nodeId: CoreNode['id'];
  update: MaybeGetter<Partial<Position>, [Position]>;
};

/** Controls for a position update stream. */
export type NodePositionStreamControls = {
  /** Updates a single node's position within this stream. */
  set: (position: NodePositionUpdate) => NodePositionEntry;
  /** Updates multiple nodes' positions within this stream. */
  setMany: (positions: NodePositionUpdate[]) => NodePositionEntry[];
  /**
   * Closes this stream, signaling that all of its updates have been dispatched. Returns
   * the de-duplicated final position of every node it touched, so a caller wrapping the
   * store can report the commit without re-deriving it. Empty if already stopped.
   */
  stop: () => NodePositionEntry[];
};

export type NodePositionStoreControls = {
  /** Returns the current position of a node. */
  get: (nodeId: string) => Position;
  /** Updates a single node's position and triggers {@link NodePositionStoreEventMap.onNodePositionsCommitted onNodePositionsCommitted}. */
  set: (position: NodePositionUpdate) => NodePositionEntry;
  /** Updates multiple nodes' positions and triggers {@link NodePositionStoreEventMap.onNodePositionsCommitted onNodePositionsCommitted}. */
  setMany: (positions: NodePositionUpdate[]) => NodePositionEntry[];
  /**
   * Opens a {@link NodePositionStreamControls position update stream}. Use this when moving nodes
   * continuously (e.g. dragging). Intermediate positions are batched inside the stream and
   * {@link NodePositionStoreEventMap.onNodePositionsCommitted onNodePositionsCommitted} only triggers once on {@link NodePositionStreamControls.stop stop},
   * so subscribers (e.g. plugins/history) see a single discrete move rather than every intermediate update.
   *
   * Streams may overlap, each committing only the nodes it touched. Direct writes stay
   * open while one is running, so the last write to a node wins.
   */
  createStream: () => NodePositionStreamControls;
  /** @internal */
  _internal: {
    add: (
      positions: { id: CoreNode['id']; position?: Partial<Position> }[],
    ) => void;
    remove: (nodeIds: CoreNode['id'][]) => void;
    nodeIdToNodePosition: Map<string, Position>;
  };
};
