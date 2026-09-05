import { nullThrows } from '@core/utils/assert';
import { GEdge, GNode, Graph } from '@magic/shared/graph';
import Fraction from 'fraction.js';

import { computed } from 'vue';

export type Transition = {
  id: GEdge['id'];
  source: GNode['id'];
  weight: Fraction;
};

export const getOutboundTotals = (
  stateIds: GNode['id'][],
  transitions: Transition[],
) => {
  const outboundTotals = new Map<GNode['id'], Fraction>(
    stateIds.map((stateId) => [stateId, new Fraction(0)]),
  );

  for (const transition of transitions) {
    const total = nullThrows(
      outboundTotals.get(transition.source),
      'transition leaves a state the chain does not have',
    );
    outboundTotals.set(transition.source, total.add(transition.weight));
  }

  return outboundTotals;
};

export const getStatesNotSummingToOne = (
  outboundTotals: Map<GNode['id'], Fraction>,
) => {
  const states = new Set<GNode['id']>();

  for (const [stateId, total] of outboundTotals) {
    if (!total.equals(1)) states.add(stateId);
  }

  return states;
};

/** a probability below zero is no probability at all, and a pair of them still adds up to 1 */
export const getNegativeTransitions = (transitions: Transition[]) =>
  transitions.filter((transition) => transition.weight.lt(0));

export const useChainValidity = (graph: Graph) => {
  const transitions = computed<Transition[]>(() => graph.edges.value);

  const outboundTotals = computed(() => {
    const stateIds = graph.nodes.value.map((node) => node.id);
    return getOutboundTotals(stateIds, transitions.value);
  });

  const invalidStates = computed(() =>
    getStatesNotSummingToOne(outboundTotals.value),
  );

  const negativeTransitions = computed(() =>
    getNegativeTransitions(transitions.value),
  );

  const isValid = computed(
    () =>
      invalidStates.value.size === 0 && negativeTransitions.value.length === 0,
  );

  return {
    outboundTotals,
    negativeTransitions,
    invalidStates,
    isValid,
  };
};
