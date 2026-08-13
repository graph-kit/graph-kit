import { ReadonlyEventHub } from '@graph/primitives/events/createEventHub';
import {
  ElementAdditionPayload,
  ElementRemovalPayload,
} from '@graph/primitives/transactions/types';
import { CoreEdge, CoreNode } from '@graph/primitives/types';
import { DeepReadonly } from 'ts-essentials';

import { CoreEventMap } from './events.ts';
import { NodePositionEntry } from './positions/types.ts';
import { EdgeWeightEntry } from './weights/types.ts';

// owned and emitted by create-graph (not core itself), since only create-graph knows when a
// fully-composed plugin action has finished, not just the underlying core transaction — this
// is the end-user event vocabulary, and create-graph has unilateral say over its shape.
//
// lives in @graph/core (not @graph/create-graph) so both @graph/plugins-shared and
// @graph/create-graph can import it without a cycle — both already depend on @graph/core,
// and @graph/create-graph depends on @graph/plugins-shared, so the reverse isn't possible
// under this repo's TS project references. core itself never emits these; create-graph
// derives them by wrapping the calls it already has authority over (actions, weight
// controls), never by subscribing to CoreEventMap.
export type ConsumerEventMap = {
  /** triggered when any nodes or edges are added or removed, or an edge weight is changed */
  onStructureChange: () => void;
  /** when nodes are added to the graph as part of a single graph action */
  onNodesAdded: (nodes: Readonly<CoreNode[]>) => void;
  /** when nodes are removed from the graph as part of a single graph action */
  onNodesRemoved: (
    removedNodeIds: Readonly<CoreNode['id'][]>,
    removedEdgeIds: Readonly<CoreEdge['id'][]>,
  ) => void;
  /** when one or more edges are added to the graph as part of a single graph action */
  onEdgesAdded: (edges: Readonly<CoreEdge[]>) => void;
  /** when one or more edges are removed from the graph as part of a single graph action */
  onEdgesRemoved: (edgeIds: Readonly<CoreEdge['id'][]>) => void;
  /** when any nodes or edges are added */
  onElementsAdded: (additions: DeepReadonly<ElementAdditionPayload>) => void;
  /** when any nodes or edges are removed */
  onElementsRemoved: (removals: DeepReadonly<ElementRemovalPayload>) => void;
  /** when one or more edge weights are changed */
  onEdgeWeightsChanged: (weights: DeepReadonly<EdgeWeightEntry[]>) => void;
  /**
   * when one or more node positions settle. fires once per drag rather than per frame,
   * and deliberately does not imply onStructureChange, since moving a node changes
   * neither the node set nor the edge set. for per frame motion use the core tier
   * onNodeMoveStream instead.
   */
  onNodePositionsCommitted: (
    positions: DeepReadonly<NodePositionEntry[]>,
  ) => void;
};

// its own hub rather than part of ConsumerEventMap: encode/decode are about the graph
// as a serialized whole, not about a structural change to it, and a consumer wiring up
// persistence wants exactly these two and nothing else. exposed at events.transit,
// mirroring the transit control surface it reports on.
export type TransitEventMap = {
  /**
   * triggered after the graph has been encoded, carrying the payload that was
   * produced. keyed by plugin name, so the precise shape is only knowable to whoever
   * owns the plugin list (see LooseGraphTransit).
   */
  onEncoded: (payload: Readonly<Record<string, unknown>>) => void;
  /**
   * triggered after a payload has passed every plugin's validation and been written
   * into the graph. the consumer events for the resulting structural change are
   * triggered first, so the graph is fully settled by the time this runs.
   */
  onDecoded: (payload: Readonly<Record<string, unknown>>) => void;
};

// the only surface plugins and graph consumers get by default: the curated consumer
// vocabulary directly at the top level. raw CoreEventMap is a machinery escape hatch,
// namespaced under _internal so it doesn't crowd the primary autocomplete — same
// "underscore signals deliberate, semi-public, not the intended path" convention as
// _resolveToken. this shape will likely change (e.g. _internal growing more fields);
// consumers reaching into _internal should expect it to move.
export type ConsumerEventsHub = ReadonlyEventHub<ConsumerEventMap> & {
  transit: ReadonlyEventHub<TransitEventMap>;
  _internal: {
    coreEvents: ReadonlyEventHub<CoreEventMap>;
  };
};
