import { nullThrows } from '@core/utils/assert';
import { GNode } from '@magic/shared/graph';
import { Lens } from '@magic/shared/lens';
import { MagicGraph } from '@magic/shared/product';
import { SimulationGuardBuilder } from '@magic/shared/simulation';
import {
  SimulationDefinition,
  SimulationEffects,
} from '@magic/shared/simulation/types';
import {
  EdgeRole,
  NodeRole,
  createEdgeIdThemer,
  createNodeIdThemer,
} from '@magic/shared/theme';

import { Ref } from 'vue';

import Distances from './Distances.vue';
import Frontier from './Frontier.vue';
import { singleSourceExplainer } from './explainer.ts';
import { SingleSourceFrame, SingleSourceFunction } from './frame.ts';

// exploring = the node the algorithm is standing on this frame.
// weighing = a node whose distance is being compared against a fresh offer.
// finalized = its distance is final, no later step can beat it.
// frontier = discovered, with a tentative distance that may still improve.
// source = the node the user picked to measure every distance from.
type SingleSourceConcept =
  'exploring' | 'weighing' | 'finalized' | 'frontier' | 'source';

export const nodeRoles = {
  exploring: 'active',
  weighing: 'candidate',
  finalized: 'settled',
  frontier: 'pending',
  source: 'anchor',
} as const satisfies Record<SingleSourceConcept, NodeRole>;

// relaxing = the edge whose weight is being tested this frame.
// shortestPath = an edge on one of the best paths found so far.
// discarded = an edge tested this frame that offered nothing better.
type SingleSourceEdgeConcept = 'relaxing' | 'shortestPath' | 'discarded';

export const edgeRoles = {
  relaxing: 'crossing',
  shortestPath: 'tree',
  discarded: 'rejected',
} as const satisfies Record<SingleSourceEdgeConcept, EdgeRole>;

export type SourceNodeId = Ref<GNode['id'] | undefined>;

export type SingleSourceOptions = {
  graph: MagicGraph;
  sourceNodeId: SourceNodeId;
};

export const slotIds = {
  distances: 'path-finding/distances',
  frontier: 'path-finding/frontier',
} as const;

const singleSourceEffects = (
  graph: MagicGraph,
): SimulationEffects<SingleSourceFrame> => {
  const frontier = createNodeIdThemer(graph, nodeRoles.frontier);
  const finalized = createNodeIdThemer(graph, nodeRoles.finalized);
  const source = createNodeIdThemer(graph, nodeRoles.source);
  const weighing = createNodeIdThemer(graph, nodeRoles.weighing);
  const exploring = createNodeIdThemer(graph, nodeRoles.exploring);

  const shortestPath = createEdgeIdThemer(graph, edgeRoles.shortestPath);
  const discarded = createEdgeIdThemer(graph, edgeRoles.discarded);
  const relaxing = createEdgeIdThemer(graph, edgeRoles.relaxing);

  // order matters: latter elements take priority over earlier ones. the source
  // sits below the two roles that describe what is happening right now, so the
  // node the user picked gives up its pink for the frame it is being worked on
  const themers = [
    frontier,
    finalized,
    source,
    weighing,
    exploring,
    shortestPath,
    discarded,
    relaxing,
  ];

  const lens: Lens = {
    id: 'path-finding/single-source',
    components: [
      { component: Distances, position: 'center-left', id: slotIds.distances },
      { component: Frontier, position: 'center-right', id: slotIds.frontier },
    ],
    activate: () => {
      for (const { themer } of themers) themer.activate();
    },
    deactivate: () => {
      for (const { themer } of themers) themer.deactivate();
    },
  };

  const syncToFrame = (frame: SingleSourceFrame) => {
    exploring.setId(frame.activeNodeId);
    weighing.setIds(frame.candidateNodeIds ?? []);
    finalized.setIds(frame.settledNodeIds ?? []);
    frontier.setIds(frame.pendingNodeIds ?? []);
    source.setId(frame.anchorNodeId);
    relaxing.setIds(frame.relaxingEdgeIds ?? []);
    shortestPath.setIds(frame.treeEdgeIds);
    discarded.setIds(frame.rejectedEdgeIds ?? []);
  };

  return {
    lens,
    explainer: singleSourceExplainer(graph),
    onSetupCompleted: syncToFrame,
    onFrameTransition: syncToFrame,
    onViolation: graph.magic.simulation.stop,
  };
};

export const singleSourceSimulationDefinition = (
  algorithm: SingleSourceFunction,
  options: SingleSourceOptions,
): SimulationDefinition<SingleSourceFrame> => ({
  guard: new SimulationGuardBuilder(options.graph)
    .custom(() => {
      const sourceInNodes = options.graph.nodes.value.some(
        (node) => node.id === options.sourceNodeId.value,
      );
      if (sourceInNodes) return;
      return { id: 'no-source-node' };
    })
    .build(),
  collectFrames: (collector) => {
    algorithm(
      options.graph,
      nullThrows(options.sourceNodeId.value, 'source node id not defined'),
    )(collector);
  },
  setup: () => singleSourceEffects(options.graph),
});
