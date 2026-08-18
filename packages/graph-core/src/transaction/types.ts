import {
  DraftEdge,
  DraftNode,
  TransactionPayload,
} from '@graph/primitives/transactions/types';

import { CoreControls } from '../types.ts';
import { InspectDraft } from './validateDraft.ts';

export type GraphState = Pick<CoreControls, 'nodes' | 'edges'>;

/** the payload as core builds it, still holding what the stores need */
export type CorePayload = Omit<
  TransactionPayload,
  'addedNodes' | 'addedEdges'
> & {
  addedNodes: DraftNode[];
  addedEdges: DraftEdge[];
};

export type TransactionOptions = {
  graph: GraphState;
  inspectDraft: InspectDraft;
  onTransactionSucceeded: (payload: CorePayload) => void;
};
