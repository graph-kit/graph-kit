import { Graph } from '@magic/shared/graph';
import {
  LensChipDefinition,
  disabledReason,
} from '@magic/shared/ui/lens-chips/types';

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

// Dont touch this. Keeping it here for reference.
//  {
//     lens: {
//       id: 'valid',
//       ...layered(
//         invalidStatesThemer(graph, chain.invalidStates),
//         outboundTotalsThemer(graph, chain.outboundTotals),
//       ),
//     },
//     name: () => `Valid: ${yesNo(chain.isValid.value)}`,
//     tooltipLabel: definitions.validity,
//   },

export const lensChips = (graph: Graph): LensChipDefinition[] => {
  const chain = useMarkovChain(graph);

  const requiresValidChain = (
    chip: LensChipDefinition,
  ): LensChipDefinition => ({
    ...chip,
    disabled: () =>
      (!chain.isValid.value &&
        `Needs a valid chain. ${definitions.validity}`) ||
      disabledReason(chip),
  });

  return [
    {
      lens: {
        id: 'communicating-classes',
        ...layered(
          communicatingClassesThemer(graph, chain.communicatingClasses),
        ),
      },
      name: {
        headline: 'Communicating Classes',
        stat: () => chain.communicatingClasses.value.length,
      },
      tooltipLabel: definitions.communicatingClasses,
    },
    {
      lens: {
        id: 'reducible',
        ...layered(
          communicatingClassesThemer(graph, chain.communicatingClasses),
        ),
      },
      name: {
        headline: 'Reducible',
        stat: () => yesNo(chain.isReducible.value),
      },
      tooltipLabel: definitions.reducible,
    },
    {
      lens: {
        id: 'recurrent-classes',
        ...layered(recurrentClassesThemer(graph, chain.recurrentClasses)),
      },
      name: {
        headline: 'Recurrent Classes',
        stat: () => chain.recurrentClasses.value.length,
      },
      tooltipLabel: definitions.recurrentClasses,
    },
    {
      lens: {
        id: 'recurrent-states',
        ...layered(recurrentStatesThemer(graph, chain.recurrentStates)),
      },
      name: {
        headline: 'Recurrent States',
        stat: () => chain.recurrentStates.value.size,
      },
      tooltipLabel: definitions.recurrentStates,
    },
    {
      lens: {
        id: 'transient-states',
        ...layered(transientStatesThemer(graph, chain.transientStates)),
      },
      name: {
        headline: 'Transient States',
        stat: () => chain.transientStates.value.size,
      },
      tooltipLabel: definitions.transientStates,
    },
    {
      lens: {
        id: 'absorbing-states',
        ...layered(absorbingStatesThemer(graph, chain.absorbingStates)),
      },
      name: {
        headline: 'Absorbing States',
        stat: () => chain.absorbingStates.value.size,
      },
      tooltipLabel: definitions.absorbingStates,
    },
    {
      lens: {
        id: 'absorbing-chain',
        ...layered(absorbingStatesThemer(graph, chain.absorbingStates)),
      },
      name: {
        headline: 'Absorbing Chain',
        stat: () => yesNo(chain.isChainAbsorbing.value),
      },
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
      name: { headline: 'Periodic', stat: () => yesNo(chain.isPeriodic.value) },
      tooltipLabel: definitions.periodic,
    },
    {
      lens: {
        id: 'ergodic',
        ...layered(
          communicatingClassesThemer(graph, chain.communicatingClasses),
        ),
      },
      name: { headline: 'Ergodic', stat: () => yesNo(chain.isErgodic.value) },
      tooltipLabel: definitions.ergodic,
    },
    {
      lens: { id: 'doubly-stochastic' },
      name: {
        headline: 'Doubly Stochastic',
        stat: () => yesNo(chain.isDoublyStochastic.value),
      },
      tooltipLabel: definitions.doublyStochastic,
    },
    {
      lens: { id: 'reversible' },
      name: {
        headline: 'Reversible',
        stat: () => yesNo(chain.isReversible.value),
      },
      disabled: () =>
        chain.isReducible.value &&
        'Needs an irreducible chain. A transient state holds none of the distribution, so detailed balance would pass over its one way transitions.',
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
      name: {
        headline: 'Stationary Distribution',
        stat: () =>
          chain.hasUniqueStationaryDistribution.value ? 'Unique' : 'None',
      },
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
      name: {
        headline: 'Limiting Distribution',
        stat: () => yesNo(chain.convergesToStationaryDistribution.value),
      },
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
  ].map(requiresValidChain);
};
