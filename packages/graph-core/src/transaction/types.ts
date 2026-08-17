import { TransactionPayload } from '@graph/primitives/transactions/types';
import { CoreEdge, CoreNode } from '@graph/primitives/types';
import Fraction from 'fraction.js';

import { Position } from '../positions/types.ts';
import { CoreControls } from '../types.ts';
import { InspectDraft } from './validateDraft.ts';

export type GraphState = Pick<CoreControls, 'nodes' | 'edges'>;

/**
 * An element on its way through a transaction, which carries what the position and weight
 * stores are filled from once it is accepted. Declared here rather than in
 * `@graph/primitives`, which has no dependencies and so cannot name a Fraction.
 */
export type DraftNode = CoreNode & { position?: Partial<Position> };
export type DraftEdge = CoreEdge & { weight?: Fraction };

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
  /** the same one the control surface hands out, so both answer with one set of rules */
  inspectDraft: InspectDraft;
  onTransactionSucceeded: (payload: CorePayload) => void;
};
