import { EventMapToEventRegistry } from '@core/events/types';
import { TransactionPayload } from '@graph/primitives/transactions/types';
import { DeepReadonly } from 'ts-essentials';

import {
  NodePositionStoreEventMap,
  createNodePositionStoreEventRegistry,
} from './positions/events.ts';
import {
  EdgeWeightStoreEventMap,
  createEdgeWeightStoreEventRegistry,
} from './weights/events.ts';

export type CoreEventMap = {
  /**
   * triggered once at the end of any atomic graph mutation batch.
   * downstream plugins (Animation, History, Broadcast) should hook into this.
   */
  onTransactionComplete: (payload: DeepReadonly<TransactionPayload>) => void;
} & NodePositionStoreEventMap &
  EdgeWeightStoreEventMap;

export type CoreEventRegistry = EventMapToEventRegistry<CoreEventMap>;

export const createCoreEventRegistry = (): CoreEventRegistry => ({
  onTransactionComplete: new Set(),

  ...createNodePositionStoreEventRegistry(),
  ...createEdgeWeightStoreEventRegistry(),
});
