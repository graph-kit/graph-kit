import { EventMapToEventRegistry } from '@core/events/types';
import { DeepReadonly } from 'ts-essentials';

import { NodePositionEntry } from './types.ts';

export type NodePositionStoreEventMap = {
  /** Triggers when a set of node positions is committed. For streamed moves, fires once on stream close. */
  onNodePositionsCommitted: (
    positions: DeepReadonly<NodePositionEntry[]>,
  ) => void;
  /** Triggers when a position update stream opens. */
  onNodeMoveStreamStart: () => void;
  /** Triggers when a position update stream closes. */
  onNodeMoveStreamEnd: () => void;
  /** Triggers on each intermediate position update within an active stream. */
  onNodeMoveStream: (positions: DeepReadonly<NodePositionEntry[]>) => void;
};

type NodePositionStoreEventRegistry =
  EventMapToEventRegistry<NodePositionStoreEventMap>;

export const createNodePositionStoreEventRegistry =
  (): NodePositionStoreEventRegistry => ({
    onNodePositionsCommitted: new Set(),
    onNodeMoveStreamStart: new Set(),
    onNodeMoveStreamEnd: new Set(),
    onNodeMoveStream: new Set(),
  });
