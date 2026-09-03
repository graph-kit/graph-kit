import { nullThrows } from '@core/utils/assert';
import { GNode, Graph } from '@magic/shared/graph';
import { Lens } from '@magic/shared/lens';
import { SimulationGuardBuilder } from '@magic/shared/simulation';
import {
  FrameCollectorFn,
  SimulationDefinition,
} from '@magic/shared/simulation/types';
import {
  EdgeIdThemer,
  EdgeRole,
  NodeIdThemer,
  NodeRole,
  createEdgeIdThemer,
  createNodeIdThemer,
} from '@magic/shared/theme';

import { Ref } from 'vue';

import Queued from './components/Queued.vue';
import Visited from './components/Visited.vue';
import { traversalExplainer } from './explainer.ts';
import { TraversalFrame } from './frame.ts';
import { TraversalSimulationOptions } from './index.ts';

// current = node being explored this frame.
// visited = has been explored.
// queued = unexplored but discovered and waiting in a queue or stack.
type TraversalConcept = 'current' | 'visited' | 'queued';

export const nodeRoles = {
  current: 'active',
  visited: 'settled',
  queued: 'pending',
} as const satisfies Record<TraversalConcept, NodeRole>;

// traveled = the edge being crossed to reach the current node this frame.
type TraversalEdgeConcept = 'traveled';

export const edgeRoles = {
  traveled: 'crossing',
} as const satisfies Record<TraversalEdgeConcept, EdgeRole>;

export type StartNodeId = Ref<GNode['id'] | undefined>;

export type TraversalFunction = (
  graph: Graph,
  startNodeId: string,
) => FrameCollectorFn<TraversalFrame>;

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

type TraversalThemers = {
  current: NodeIdThemer;
  visited: NodeIdThemer;
  queued: NodeIdThemer;
  traveled: EdgeIdThemer;
  lens: Lens;
  syncToFrame: (frame: TraversalFrame) => void;
};

export const slotIds = {
  visited: 'traversal/visited',
  queue: 'traversal/queued',
} as const;

const traversalThemers = (graph: Graph): TraversalThemers => {
  const current = createNodeIdThemer(graph, nodeRoles.current);
  const queued = createNodeIdThemer(graph, nodeRoles.queued);
  const visited = createNodeIdThemer(graph, nodeRoles.visited);
  const traveled = createEdgeIdThemer(graph, edgeRoles.traveled);
  // order matters: latter elements take priority over earlier ones
  const themers = [queued, visited, current, traveled];
  return {
    current,
    visited,
    queued,
    traveled,
    lens: {
      id: 'traversals',
      components: [
        { component: Visited, position: 'center-left', id: slotIds.visited },
        { component: Queued, position: 'center-right', id: slotIds.queue },
      ],
      activate: () => {
        for (const { themer } of themers) themer.activate();
      },
      deactivate: () => {
        for (const { themer } of themers) themer.deactivate();
      },
    },
    syncToFrame: (frame) => {
      current.setId(frame.exploredNode);
      queued.setIds(frame.queuedNodeIds ?? []);
      visited.setIds(frame.visitedNodeIds ?? []);
      traveled.setIds(frame.traveledEdgeIds ?? []);
    },
  };
};

export const traversalSimulationDefinition = (
  id: string,
  traversal: TraversalFunction,
  options: TraversalSimulationOptions,
): SimulationDefinition<TraversalFrame> => {
  return {
    id,
    guard: new SimulationGuardBuilder(options.graph)
      .custom(() => {
        const startNodeInNodes =
          options.startNodeId.value &&
          options.graph.nodes.value.some(
            (n) => n.id === options.startNodeId.value,
          );
        if (startNodeInNodes) return;
        return {
          id: 'no-start-node',
        };
      })
      .build(),
    collectFrames: (collector) => {
      traversal(
        options.graph,
        nullThrows(options.startNodeId.value, 'start node id not defined'),
      )(collector);
    },
    setup: (context) => {
      const { lens, syncToFrame } = traversalThemers(options.graph);
      return {
        lens,
        explainer: traversalExplainer(options.graph),
        onSetupCompleted: syncToFrame,
        onFrameTransition: syncToFrame,
        onViolation: context.stopSimulation,
      };
    },
  };
};
