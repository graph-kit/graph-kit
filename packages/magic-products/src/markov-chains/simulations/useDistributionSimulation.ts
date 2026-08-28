import { nullThrows } from '@core/utils/assert';
import { Explainer } from '@magic/shared/explainer';
import { GNode, Graph } from '@magic/shared/graph';
import { SimulationDefinition } from '@magic/shared/simulation/types';
import Fraction from 'fraction.js';

import { Ref, computed, shallowRef } from 'vue';

import { distributionThemer } from '../themers/distribution.ts';
import { layered } from '../themers/layered.ts';
import { advance } from './advance.ts';
import { DistributionFrame } from './frame.ts';

const toFrame = (
  stateIds: GNode['id'][],
  probabilities: Fraction[],
): DistributionFrame =>
  new Map(stateIds.map((id, index) => [id, probabilities[index]]));

// the playhead position is the transition count, so it is read off the shell
// rather than carried on every frame
const distributionExplainer = (): Explainer => ({
  content: ({ shell }) => {
    const { playhead } = nullThrows(
      shell.simulation.current.value,
      'distribution explainer ran with no simulation running',
    );
    const transitions = playhead.position;
    if (transitions === 0) return 'Starting Distribution';
    if (transitions === 1) return 'After 1 Transition';
    return `After ${transitions} Transitions`;
  },
});

export const distributionSimulationDefinition = (
  graph: Graph,
  startingDistribution: Ref<Fraction[]>,
  simplify: Ref<boolean>,
): SimulationDefinition<DistributionFrame> => {
  const currentFrame = shallowRef<DistributionFrame>();
  const distribution = computed(() => currentFrame.value);

  return {
    /*
      every step walks from the starting distribution rather than from the step
      before it, so a frame never depends on one the playhead has already left
    */
    frameAt: (step) => {
      const matrix = graph.transitionMatrix.value;
      let probabilities = startingDistribution.value;
      for (let i = 0; i < step; i++) {
        probabilities = advance(probabilities, matrix);
      }
      const stateIds = graph.nodes.value.map((node) => node.id);
      return toFrame(stateIds, probabilities);
    },

    // the distribution the user entered describes the chain as it was, so editing
    // a state or a transition ends the run rather than recomputing against it
    recomputeFramesOnStructureChange: false,

    setup: (context) => {
      const stopOnStructureChange = () => context.stopSimulation();
      // rawEvents because this runs outside a component, and graph.events ties
      // every subscribe to an onUnmounted
      graph.rawEvents.subscribe('onStructureChange', stopOnStructureChange);

      return {
        lens: {
          id: 'distribution',
          ...layered(distributionThemer(graph, distribution, simplify)),
        },
        explainer: distributionExplainer,
        onSetupCompleted: (frame) => (currentFrame.value = frame),
        onFrameTransition: (frame) => (currentFrame.value = frame),
        onTeardownCompleted: () =>
          graph.rawEvents.unsubscribe(
            'onStructureChange',
            stopOnStructureChange,
          ),
      };
    },
  };
};
