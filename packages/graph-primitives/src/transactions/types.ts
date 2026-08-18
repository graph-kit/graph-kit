import Fraction from 'fraction.js';

import { CoreEdge, CoreNode, Position } from '../types.ts';

/**
 * An element on its way through a transaction, carrying what fills the position and weight
 * stores once it is accepted.
 */
export type DraftNode = CoreNode & { position?: Partial<Position> };
export type DraftEdge = CoreEdge & { weight?: Fraction };

export type TransactionPayload = {
  addedNodes: CoreNode[];
  addedEdges: CoreEdge[];

  removedNodeIds: CoreNode['id'][];
  removedEdgeIds: CoreEdge['id'][];
};

export type TransactionDraft = {
  addNodes: CoreNode[];
  addEdges: CoreEdge[];

  removeNodeIds: CoreNode['id'][];
  removeEdgeIds: CoreEdge['id'][];
};

export type CommitTransaction = (
  draft: Partial<TransactionDraft>,
) => TransactionPayload;

export type ElementRemovalPayload = Pick<
  TransactionPayload,
  'removedNodeIds' | 'removedEdgeIds'
>;

export type ElementAdditionPayload = Pick<
  TransactionPayload,
  'addedNodes' | 'addedEdges'
>;
