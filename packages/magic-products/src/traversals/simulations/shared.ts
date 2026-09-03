import { nullThrows } from '@core/utils/assert';
import { GNode, Graph } from '@magic/shared/graph';
import { SimulationGuardBuilder } from '@magic/shared/simulation';
import { EdgeRole, NodeRole } from '@magic/shared/theme';

import { Ref } from 'vue';

// current = node being explored this frame.
// visited = has been explored.
// pending = discovered but not explored yet, still waiting its turn.
type TraversalConcept = 'current' | 'visited' | 'pending';

export const nodeRoles = {
  current: 'active',
  visited: 'settled',
  pending: 'pending',
} as const satisfies Record<TraversalConcept, NodeRole>;

// traveled = an edge leading out of the node being explored this frame.
// active = the single edge whose far end is being decided on right now.
type TraversalEdgeConcept = 'traveled' | 'active';

export const edgeRoles = {
  traveled: 'crossing',
  active: 'active',
} as const satisfies Record<TraversalEdgeConcept, EdgeRole>;

export type StartNodeId = Ref<GNode['id'] | undefined>;

export type TraversalSimulationOptions = {
  graph: Graph;
  startNodeId: StartNodeId;
};

/**
 * the edge a traversal crosses to get from one node to the next. throws rather
 * than returning undefined because both endpoints come from the adjacency list,
 * so a missing edge means the adjacency list and the edge set disagree
 */
export const edgeBetween = (
  graph: Graph,
  sourceNodeId: GNode['id'],
  targetNodeId: GNode['id'],
) =>
  nullThrows(
    graph.helpers.nodes.getEdgeBetween(sourceNodeId, targetNodeId),
    `no edge between ${sourceNodeId} and ${targetNodeId}`,
  ).id;

/** neither traversal can run until the node it was told to start from is on the canvas */
export const startNodeGuard = (options: TraversalSimulationOptions) =>
  new SimulationGuardBuilder(options.graph)
    .custom(() => {
      const startNodeInNodes =
        options.startNodeId.value &&
        options.graph.nodes.value.some(
          (node) => node.id === options.startNodeId.value,
        );
      if (startNodeInNodes) return;
      return {
        id: 'no-start-node',
      };
    })
    .build();
