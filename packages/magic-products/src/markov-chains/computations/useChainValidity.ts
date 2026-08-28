import { nullThrows } from '@core/utils/assert';
import { GNode, Graph } from '@magic/shared/graph';
import Fraction from 'fraction.js';

import { computed } from 'vue';

export type Transition = {
  source: GNode['id'];
  weight: Fraction;
};

export const getInvalidStates = (
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

  const invalidStates = new Set<GNode['id']>();
  for (const [stateId, total] of outboundTotals) {
    if (!total.equals(1)) invalidStates.add(stateId);
  }

  return invalidStates;
};

export const useChainValidity = (graph: Graph) => {
  const invalidStates = computed(() =>
    getInvalidStates(
      graph.nodes.value.map((node) => node.id),
      graph.edges.value.map((edge) => {
        const { weight } = graph.getEdge(edge.id);
        return { source: edge.source, weight };
      }),
    ),
  );

  const isValid = computed(() => invalidStates.value.size === 0);

  return { invalidStates, isValid };
};
