import { CoreEdge, CoreNode } from '../types.ts';

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
