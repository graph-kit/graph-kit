import { Graph } from '@magic/shared/graph';
import { LensChipDefinition } from '@magic/shared/ui/lens-chips/types';

import { definitions } from './definitions.ts';
import { absorbingStatesThemer } from './themers/absorbingStates.ts';
import { communicatingClassesThemer } from './themers/communicatingClasses.ts';
import { invalidStatesThemer } from './themers/invalidStates.ts';
import { layered } from './themers/layered.ts';
import { meanRecurrenceTimesThemer } from './themers/meanRecurrenceTimes.ts';
import { outboundTotalsThemer } from './themers/outboundTotals.ts';
import { periodicityThemer } from './themers/periodicity.ts';
import { recurrentClassesThemer } from './themers/recurrentClasses.ts';
import { recurrentStatesThemer } from './themers/recurrentStates.ts';
import { stationaryDistributionThemer } from './themers/stationaryDistribution.ts';
import { transientStatesThemer } from './themers/transientStates.ts';
import { useMarkovChain } from './useMarkovChain.ts';

/** a property only asked of some chains, so it answers with nothing rather than a misleading no */
const yesNo = (answer: boolean | undefined) => {
  if (answer === undefined) return 'N/A';
  return answer ? 'Yes' : 'No';
};

export const lensChips = (graph: Graph): LensChipDefinition[] => {
  const chain = useMarkovChain(graph);

  return [
    {
      lens: {
        id: 'valid',
        ...layered(
          invalidStatesThemer(graph, chain.invalidStates),
          outboundTotalsThemer(graph, chain.outboundTotals),
        ),
      },
      name: () => `Valid: ${yesNo(chain.isValid.value)}`,
      tooltipLabel: definitions.validity,
    },
    {
      lens: {
        id: 'communicating-classes',
        ...layered(
          communicatingClassesThemer(graph, chain.communicatingClasses),
        ),
      },
      name: () =>
        `Communicating Classes: ${chain.communicatingClasses.value.length}`,
      tooltipLabel: definitions.communicatingClasses,
    },
    {
      lens: {
        id: 'reducible',
        ...layered(
          communicatingClassesThemer(graph, chain.communicatingClasses),
        ),
      },
      name: () => `Reducible: ${yesNo(chain.isReducible.value)}`,
      tooltipLabel: definitions.reducible,
    },
    {
      lens: {
        id: 'recurrent-classes',
        ...layered(recurrentClassesThemer(graph, chain.recurrentClasses)),
      },
      name: () => `Recurrent Classes: ${chain.recurrentClasses.value.length}`,
      tooltipLabel: definitions.recurrentClasses,
    },
    {
      lens: {
        id: 'recurrent-states',
        ...layered(recurrentStatesThemer(graph, chain.recurrentStates)),
      },
      name: () => `Recurrent States: ${chain.recurrentStates.value.size}`,
      tooltipLabel: definitions.recurrentStates,
    },
    {
      lens: {
        id: 'transient-states',
        ...layered(transientStatesThemer(graph, chain.transientStates)),
      },
      name: () => `Transient States: ${chain.transientStates.value.size}`,
      tooltipLabel: definitions.transientStates,
    },
    {
      lens: {
        id: 'absorbing-states',
        ...layered(absorbingStatesThemer(graph, chain.absorbingStates)),
      },
      name: () => `Absorbing States: ${chain.absorbingStates.value.size}`,
      tooltipLabel: definitions.absorbingStates,
    },
    {
      lens: {
        id: 'absorbing-chain',
        ...layered(absorbingStatesThemer(graph, chain.absorbingStates)),
      },
      name: () => `Absorbing Chain: ${yesNo(chain.isChainAbsorbing.value)}`,
      tooltipLabel: definitions.absorbingChain,
    },
    {
      lens: {
        id: 'periodic',
        ...layered(
          recurrentClassesThemer(graph, chain.recurrentClasses),
          periodicityThemer(
            graph,
            chain.recurrentClasses,
            chain.recurrentClassPeriods,
          ),
        ),
      },
      name: () => `Periodic: ${yesNo(chain.isPeriodic.value)}`,
      tooltipLabel: definitions.periodic,
    },
    {
      lens: {
        id: 'ergodic',
        ...layered(
          communicatingClassesThemer(graph, chain.communicatingClasses),
        ),
      },
      name: () => `Ergodic: ${yesNo(chain.isErgodic.value)}`,
      tooltipLabel: definitions.ergodic,
    },
    {
      lens: { id: 'doubly-stochastic' },
      name: () => `Doubly Stochastic: ${yesNo(chain.isDoublyStochastic.value)}`,
      tooltipLabel: definitions.doublyStochastic,
    },
    {
      lens: { id: 'reversible' },
      name: () => `Reversible: ${yesNo(chain.isReversible.value)}`,
      tooltipLabel: definitions.reversible,
    },
    {
      lens: {
        id: 'stationary-distribution',
        ...layered(
          recurrentClassesThemer(graph, chain.recurrentClasses),
          stationaryDistributionThemer(graph, chain.stationaryDistribution),
        ),
      },
      name: () =>
        `Stationary Distribution: ${chain.hasUniqueStationaryDistribution.value ? 'Unique' : 'None'}`,
      tooltipLabel: definitions.stationaryDistribution,
    },
    {
      lens: {
        id: 'limiting-distribution',
        ...layered(
          recurrentClassesThemer(graph, chain.recurrentClasses),
          stationaryDistributionThemer(graph, chain.stationaryDistribution),
        ),
      },
      name: () =>
        `Limiting Distribution: ${yesNo(chain.convergesToStationaryDistribution.value)}`,
      tooltipLabel: definitions.limitingDistribution,
    },
    {
      lens: {
        id: 'mean-recurrence-time',
        ...layered(
          recurrentClassesThemer(graph, chain.recurrentClasses),
          meanRecurrenceTimesThemer(graph, chain.meanRecurrenceTimes),
        ),
      },
      name: () => 'Mean Recurrence Time',
      tooltipLabel: definitions.meanRecurrenceTime,
    },
  ];
};
