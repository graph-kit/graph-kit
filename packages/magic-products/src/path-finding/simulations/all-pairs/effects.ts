import { Graph } from '@magic/shared/graph';
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

import Matrix from './Matrix.vue';
import { allPairsExplainer } from './explainer.ts';
import { AllPairsFrame, AllPairsFunction } from './frame.ts';

type AllPairsNodeConcept = 'pivot' | 'pair' | 'onNegativeCycle';

export const nodeRoles = {
  pivot: 'active',
  pair: 'candidate',
  // sits on negative cycle
  onNegativeCycle: 'violation',
} as const satisfies Record<AllPairsNodeConcept, NodeRole>;

type AllPairsEdgeConcept =
  'currentRoute' | 'detourRoute' | 'rejectedRoute' | 'onNegativeCycle';

export const edgeRoles = {
  currentRoute: 'tree',
  detourRoute: 'weighing',
  rejectedRoute: 'rejected',
  // is part of negative cycle
  onNegativeCycle: 'violation',
} as const satisfies Record<AllPairsEdgeConcept, EdgeRole>;

export type AllPairsOptions = {
  graph: Graph;
};

export const matrixSlotId = 'path-finding/matrix';

const allPairsEffects = (
  graph: Graph,
  context: SetupContext<AllPairsFrame>,
): SimulationEffects<AllPairsFrame> => {
  const pivot = createNodeIdThemer(graph, nodeRoles.pivot);
  const pair = createNodeIdThemer(graph, nodeRoles.pair);
  const cycleNodes = createNodeIdThemer(graph, nodeRoles.onNegativeCycle);

  const currentRoute = createEdgeIdThemer(graph, edgeRoles.currentRoute);
  const detourRoute = createEdgeIdThemer(graph, edgeRoles.detourRoute);
  const rejectedRoute = createEdgeIdThemer(graph, edgeRoles.rejectedRoute);
  const cycleEdges = createEdgeIdThemer(graph, edgeRoles.onNegativeCycle);

  // latter themers win where two routes share an edge, so the route that
  // survives the frame is painted after the one it beat
  const themers = [
    cycleNodes,
    pair,
    pivot,
    rejectedRoute,
    currentRoute,
    detourRoute,
    cycleEdges,
  ];

  const lens: Lens = {
    id: 'path-finding/all-pairs',
    components: [
      { component: Matrix, position: 'center-left', id: matrixSlotId },
    ],
    activate: () => {
      for (const { themer } of themers) themer.activate();
    },
    deactivate: () => {
      for (const { themer } of themers) themer.deactivate();
    },
  };

  const syncToFrame = (frame: AllPairsFrame) => {
    pivot.setId(frame.activeNodeId);
    pair.setIds(frame.candidateNodeIds ?? []);
    cycleNodes.setIds(frame.cycleNodeIds ?? []);
    currentRoute.setIds(frame.routeEdgeIds ?? []);
    detourRoute.setIds(frame.detourEdgeIds ?? []);
    rejectedRoute.setIds(frame.rejectedEdgeIds ?? []);
    cycleEdges.setIds(frame.cycleEdgeIds ?? []);
  };

  return {
    lens,
    explainer: allPairsExplainer(graph),
    onSetupCompleted: syncToFrame,
    onFrameTransition: syncToFrame,
    onViolation: context.stopSimulation,
  };
};

export const allPairsSimulationDefinition = (
  id: string,
  algorithm: AllPairsFunction,
  options: AllPairsOptions,
): SimulationDefinition<AllPairsFrame> => ({
  id,
  guard: new SimulationGuardBuilder(options.graph).minNodes(1).build(),
  collectFrames: (collector) => {
    algorithm(options.graph)(collector);
  },
  setup: (context) => allPairsEffects(options.graph, context),
});
