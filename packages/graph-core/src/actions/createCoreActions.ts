import { CommitTransaction } from '@graph/primitives/transactions/types';
import { CoreEdge, CoreNode } from '@graph/primitives/types';
import { batch } from '@reactive/primitives/index';

import {
  createAddEdgeHandler,
  createAddElementsHandler,
  createAddNodeHandler,
  createRemoveEdgeHandler,
  createRemoveElementsHandler,
  createRemoveNodeHandler,
} from './methods/index.ts';

export type CreateCoreActionOptions = {
  commitTransaction: CommitTransaction;
  /**
   * live state only: the position and weight stores belong to the transaction, so that an
   * element the transaction rejects never reaches one
   */
  graph: {
    nodes: () => CoreNode[];
    edges: () => CoreEdge[];
  };
};

/**
 * the action is the unit of atomicity, not the individual signal write.
 *
 * one action is several writes: `nodes`, `edges`, and the position and weight stores.
 * unbatched, each flushes on its own and readers see states the graph never logically
 * passes through. removing a node with an edge attached is the case that bites: the
 * `nodes` write lands first, so readers briefly see an edge whose endpoint is gone.
 */
const atomic =
  <Args extends unknown[], Return>(handler: (...args: Args) => Return) =>
  (...args: Args): Return =>
    batch(() => handler(...args));

export const createCoreActions = (options: CreateCoreActionOptions) => ({
  addNode: atomic(createAddNodeHandler(options)),
  removeNode: atomic(createRemoveNodeHandler(options)),

  addEdge: atomic(createAddEdgeHandler(options)),
  removeEdge: atomic(createRemoveEdgeHandler(options)),

  addElements: atomic(createAddElementsHandler(options)),
  removeElements: atomic(createRemoveElementsHandler(options)),
});
