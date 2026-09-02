import { Graph } from '@magic/shared/graph';
import { Lens } from '@magic/shared/lens/types';

import { invalidStatesThemer } from './themers/invalidStates.ts';
import { layered } from './themers/layered.ts';
import { outboundTotalsThemer } from './themers/outboundTotals.ts';
import { MarkovChain } from './useMarkovChain.ts';

/** paints which states break the chain and labels each with what its transitions add up to */
export const validityLens = (graph: Graph, chain: MarkovChain): Lens => ({
  id: 'valid',
  ...layered(
    invalidStatesThemer(graph, chain.invalidStates),
    outboundTotalsThemer(graph, chain.outboundTotals),
  ),
});
