import { TransitControls } from '@graph/primitives/transit/types';
import { CoreEdge, CoreNode } from '@graph/primitives/types';

import { CoreGraphHelpers } from './helpers/types.ts';
import { CoreOptions } from './options.ts';
import { NodePositionStoreControls, Position } from './positions/types.ts';
import { InspectDraft } from './transaction/validateDraft.ts';
import { EdgeWeightStoreControls } from './weights/types.ts';

/**
 * What a transaction would make of an edit, answered without making it, so a consumer can
 * refuse where the user asked instead of finding out through a rejected action.
 */
export type CoreInspectControls = {
  /** the whole draft, for an edit that is more than one element */
  draft: InspectDraft;
  /** may an edge run between these two nodes? */
  canAddEdge: (edge: Pick<CoreEdge, 'source' | 'target'>) => boolean;
  /** may a node claim this id? */
  canAddNode: (node: Pick<CoreNode, 'id'>) => boolean;
};

export type CoreControls = {
  nodes: () => Readonly<CoreNode[]>;
  edges: () => Readonly<CoreEdge[]>;

  isNode: (id: string) => boolean;
  isEdge: (id: string) => boolean;

  inspect: CoreInspectControls;

  nodeIdToIndex: (id: string) => number;
  edgeIdToIndex: (id: string) => number;

  metadata: Readonly<CoreOptions>;

  helpers: CoreGraphHelpers;
  positions: NodePositionStoreControls;
  weights: EdgeWeightStoreControls;
};

type NodePositionTransitEncode = {
  id: string;
  position: Position;
};

type EdgeWeightsTransitEncode = {
  id: string;
  weight: string; // serialized fraction encoding
};

export type CoreTransitPayload = {
  nodes: CoreNode[];
  edges: CoreEdge[];
  nodePositions: NodePositionTransitEncode[];
  edgeWeights: EdgeWeightsTransitEncode[];
};

export type CoreTransitControls = TransitControls<CoreTransitPayload>;
