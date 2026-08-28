import { Graph } from '@magic/shared/graph';
import { Lens } from '@magic/shared/lens';
import { SimulationGuardBuilder } from '@magic/shared/simulation';
import {
  SetupContext,
  SimulationDefinition,
  SimulationEffects,
} from '@magic/shared/simulation/types';
import { NodeRole, createNodeIdThemer } from '@magic/shared/theme';

import Matrix from './Matrix.vue';
import { allPairsExplainer } from './explainer.ts';
import { AllPairsFrame, AllPairsFunction } from './frame.ts';

// pivot = the node every pair is currently being asked to detour through.
// pair = the two ends of the trip being weighed against that detour.
type AllPairsConcept = 'pivot' | 'pair';

export const nodeRoles = {
  pivot: 'active',
  pair: 'candidate',
} as const satisfies Record<AllPairsConcept, NodeRole>;

/*
  no edge roles. floyd warshall never relaxes a named edge: it compares two
  table cells, so there is nothing on the canvas to paint but the three nodes
  involved
*/

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

  // order matters: latter elements take priority over earlier ones
  const themers = [pair, pivot];

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
  };

  return {
    lens,
    explainer: allPairsExplainer(),
    onSetupCompleted: syncToFrame,
    onFrameTransition: syncToFrame,
    onViolation: context.stopSimulation,
  };
};

export const allPairsSimulationDefinition = (
  algorithm: AllPairsFunction,
  options: AllPairsOptions,
): SimulationDefinition<AllPairsFrame> => ({
  guard: new SimulationGuardBuilder(options.graph).minNodes(1).build(),
  collectFrames: (collector) => {
    algorithm(options.graph)(collector);
  },
  setup: (context) => allPairsEffects(options.graph, context),
});
