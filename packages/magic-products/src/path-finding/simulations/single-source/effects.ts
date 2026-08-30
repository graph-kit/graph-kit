import { nullThrows } from '@core/utils/assert';
import { GNode, Graph } from '@magic/shared/graph';
import { Lens } from '@magic/shared/lens';
import { SimulationGuardBuilder } from '@magic/shared/simulation';
import {
  SetupContext,
  SimulationDefinition,
  SimulationEffects,
} from '@magic/shared/simulation/types';
import {
  EdgeRole,
  NodeRole,
  createEdgeIdThemer,
  createNodeIdThemer,
} from '@magic/shared/theme';

import { Ref, ref } from 'vue';

import { negativeWeightEdge } from '../arcs.ts';
import Distances from './Distances.vue';
import Frontier from './Frontier.vue';
import { createDistanceThemer } from './createDistanceThemer.ts';
import {
  distancesSlotId,
  frontierSlotId,
  singleSourceExplainer,
} from './explainer.ts';
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
  graph: Graph;
  sourceNodeId: SourceNodeId;
  requiresNonNegativeWeights?: boolean;
};

const singleSourceEffects = (
  graph: Graph,
  context: SetupContext<SingleSourceFrame>,
): SimulationEffects<SingleSourceFrame> => {
  const frontier = createNodeIdThemer(graph, nodeRoles.frontier);
  const finalized = createNodeIdThemer(graph, nodeRoles.finalized);
  const source = createNodeIdThemer(graph, nodeRoles.source);
  const weighing = createNodeIdThemer(graph, nodeRoles.weighing);
  const exploring = createNodeIdThemer(graph, nodeRoles.exploring);

  const shortestPath = createEdgeIdThemer(graph, edgeRoles.shortestPath);
  const discarded = createEdgeIdThemer(graph, edgeRoles.discarded);
  const relaxing = createEdgeIdThemer(graph, edgeRoles.relaxing);

  const currentFrame = ref<SingleSourceFrame>();

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
    { themer: createDistanceThemer(graph, currentFrame) },
  ];

  const lens: Lens = {
    id: 'path-finding/single-source',
    components: [
      {
        component: Distances,
        position: 'center-left',
        id: distancesSlotId,
      },
      {
        component: Frontier,
        position: 'center-right',
        id: frontierSlotId,
      },
    ],
    activate: () => {
      for (const { themer } of themers) themer.activate();
    },
    deactivate: () => {
      for (const { themer } of themers) themer.deactivate();
    },
  };

  const syncToFrame = (frame: SingleSourceFrame) => {
    currentFrame.value = frame;
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
    onViolation: context.stopSimulation,
  };
};

export const singleSourceSimulationDefinition = (
  algorithm: SingleSourceFunction,
  options: SingleSourceOptions,
): Omit<SimulationDefinition<SingleSourceFrame>, 'name'> => ({
  guard: new SimulationGuardBuilder(options.graph)
    /*
      checked again while the run is on screen, not only before it starts: an
      edge weight change counts as a structure change, so a weight edited into
      the negative mid run stops the simulation rather than quietly invalidating
      everything already settled
    */
    .custom(() => {
      if (!options.requiresNonNegativeWeights) return;

      const negative = negativeWeightEdge(options.graph);
      if (!negative) return;

      return {
        id: 'negative-weight',
        explainer: {
          content: `{${negative.id}} costs less than <0>. Dijkstra's finalizes a cost as soon as it is the cheapest, which a negative edge can undercut later, so it cannot run here. Bellman-Ford can`,
        },
      };
    })
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
  setup: (context) => singleSourceEffects(options.graph, context),
});
