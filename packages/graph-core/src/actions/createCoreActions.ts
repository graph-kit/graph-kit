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
  graph: {
    nodes: () => CoreNode[];
    edges: () => CoreEdge[];
  };
};

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
