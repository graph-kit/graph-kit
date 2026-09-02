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

import { findNegativeWeightEdge } from '../edges.ts';
import Distances from './Distances.vue';
import Frontier from './Frontier.vue';
import Sweep from './Sweep.vue';
import { createDistanceThemer } from './createDistanceThemer.ts';
import {
  distancesSlotId,
  frontierSlotId,
  singleSourceExplainer,
  sweepSlotId,
} from './explainer.ts';
import { SingleSourceFrame, SingleSourceFunction } from './frame.ts';

type SingleSourceNodeConcept =
  'exploring' | 'finalized' | 'frontier' | 'source' | 'looping';

export const nodeRoles = {
  exploring: 'active',
  finalized: 'settled',
  frontier: 'pending',
  source: 'anchor',
  // sits on negative cycle
  looping: 'violation',
} as const satisfies Record<SingleSourceNodeConcept, NodeRole>;

type SingleSourceEdgeConcept =
  'relaxing' | 'shortestPath' | 'discarded' | 'looping';

export const edgeRoles = {
  relaxing: 'crossing',
  shortestPath: 'tree',
  discarded: 'rejected',
  // is part of negative cycle
  looping: 'violation',
} as const satisfies Record<SingleSourceEdgeConcept, EdgeRole>;

/** shows the user an error rather than exiting the simulation */
const RECOVERABLE_VIOLATION = 'negative-weight';

export type SourceNodeId = Ref<GNode['id'] | undefined>;

export type SingleSourceOptions = {
  graph: Graph;
  sourceNodeId: SourceNodeId;
  requiresNonNegativeWeights?: boolean;
  dimsTentativeDistances?: boolean;
};

const singleSourceEffects = (
  options: SingleSourceOptions,
  context: SetupContext<SingleSourceFrame>,
): SimulationEffects<SingleSourceFrame> => {
  const { graph } = options;
  const frontier = createNodeIdThemer(graph, nodeRoles.frontier);
  const finalized = createNodeIdThemer(graph, nodeRoles.finalized);
  const source = createNodeIdThemer(graph, nodeRoles.source);
  const exploring = createNodeIdThemer(graph, nodeRoles.exploring);
  const loopingNodes = createNodeIdThemer(graph, nodeRoles.looping);

  const shortestPath = createEdgeIdThemer(graph, edgeRoles.shortestPath);
  const discarded = createEdgeIdThemer(graph, edgeRoles.discarded);
  const loopingEdges = createEdgeIdThemer(graph, edgeRoles.looping);
  const relaxing = createEdgeIdThemer(graph, edgeRoles.relaxing);

  const currentFrame = ref<SingleSourceFrame>();

  /*
    order matters: latter elements take priority over earlier ones. the source
    sits below the role that describes what is happening right now, so the node
    the user picked gives up its pink for the frame it is being worked on. the
    cycle sits above the tree it is made of, or the shortest path green would
    paint over the very edges being called out, and below the two roles that
    follow the walker, so the edge being crossed and the node it lands on still
    read as this frame's move rather than blending into the loop
  */
  const themers = [
    frontier,
    finalized,
    source,
    loopingNodes,
    exploring,
    shortestPath,
    discarded,
    loopingEdges,
    relaxing,
    {
      themer: createDistanceThemer(graph, currentFrame, {
        dimTentativeDistances: options.dimsTentativeDistances ?? false,
      }),
    },
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
      {
        component: Sweep,
        position: 'center-right',
        id: sweepSlotId,
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
    finalized.setIds(frame.settledNodeIds ?? []);
    frontier.setIds(frame.pendingNodeIds ?? []);
    source.setId(frame.anchorNodeId);
    relaxing.setIds(frame.relaxingEdgeIds ?? []);
    loopingNodes.setIds(frame.cycleNodeIds ?? []);
    loopingEdges.setIds(frame.cycleEdgeIds ?? []);
    shortestPath.setIds(frame.treeEdgeIds);
    discarded.setIds(frame.rejectedEdgeIds ?? []);
  };

  return {
    lens,
    explainer: singleSourceExplainer(graph),
    onSetupCompleted: syncToFrame,
    onFrameTransition: syncToFrame,
    onViolation: (violation) => {
      if (violation.id === RECOVERABLE_VIOLATION) return;
      context.stopSimulation();
    },
  };
};

export const singleSourceSimulationDefinition = (
  algorithm: SingleSourceFunction,
  options: SingleSourceOptions,
): SimulationDefinition<SingleSourceFrame> => ({
  guard: new SimulationGuardBuilder(options.graph)
    .custom(() => {
      if (!options.requiresNonNegativeWeights) return;

      const negative = findNegativeWeightEdge(options.graph);
      if (!negative) return;

      return {
        id: RECOVERABLE_VIOLATION,
        explainer: {
          content: `{${negative.id}} costs less than <0>. Dijkstra's does not allow negative weights`,
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
  setup: (context) => singleSourceEffects(options, context),
});
