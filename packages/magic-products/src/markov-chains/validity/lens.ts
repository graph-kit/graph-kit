import { Graph } from '@magic/shared/graph';
import { Lens } from '@magic/shared/lens/types';

import { layered } from '../themers/layered.ts';
import { MarkovChain } from '../useMarkovChain.ts';
import { invalidStatesThemer } from './themers/invalidStates.ts';
import { negativeTransitionsThemer } from './themers/negativeTransitions.ts';
import { outboundTotalsThemer } from './themers/outboundTotals.ts';

export const VALIDITY_EXPLAINER_SLOT_ID = 'markov-chains/validity-explainer';

/** paints which states break the chain and labels each with what its transitions add up to */
export const validityLens = (graph: Graph, chain: MarkovChain): Lens => ({
  id: 'valid',
  ...layered(
    invalidStatesThemer(graph, chain.invalidStates),
    outboundTotalsThemer(graph, chain.outboundTotals, chain.invalidStates),
    negativeTransitionsThemer(graph, chain.negativeTransitions),
  ),
});

/** paints the transitions that carry a probability below zero */
export const negativeTransitionsLens = (
  graph: Graph,
  chain: MarkovChain,
): Lens => ({
  id: 'negative-transitions',
  ...layered(negativeTransitionsThemer(graph, chain.negativeTransitions)),
});
