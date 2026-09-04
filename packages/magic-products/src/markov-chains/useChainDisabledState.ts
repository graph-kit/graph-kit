import { Graph } from '@magic/shared/graph';
import { DisabledLens, Lens } from '@magic/shared/lens/types';
import { Shell } from '@magic/shared/product';

import { ComputedRef, computed } from 'vue';

import { MarkovChain } from './useMarkovChain.ts';
import { VALIDITY_EXPLAINER_SLOT_ID, validityLens } from './validityLens.ts';

/**
 * why nothing can be said about the chain yet, or `false` once something can,
 * for anything that answers a question about the chain to disable itself with
 */
export const useChainDisabledState = (
  shell: Shell,
  graph: Graph,
  chain: MarkovChain,
): ComputedRef<DisabledLens | false> => {
  const validity = validityLens(graph, chain);

  const explainedValidity: Lens = {
    ...validity,
    activate: () => {
      validity.activate?.();
      shell.componentSlots.setHighlighted(VALIDITY_EXPLAINER_SLOT_ID);
    },
    deactivate: () => {
      shell.componentSlots.clearHighlighted();
      validity.deactivate?.();
    },
  };

  return computed(() => {
    if (graph.nodes.value.length === 0) return { reason: 'Add a node/state' };
    if (!chain.isValid.value)
      return { reason: 'Chain is invalid', lens: explainedValidity };
    return false;
  });
};
