import AdjacencyMatrix from '@magic/shared/AdjacencyMatrix';
import { Graph } from '@magic/shared/graph';
import { Shell } from '@magic/shared/product';
import {
  LensChipDefinition,
  disabledState,
} from '@magic/shared/ui/lens-chips/types';

import { definitions } from './definitions.ts';
import { absorbingStatesThemer } from './themers/absorbingStates.ts';
import { communicatingClassesThemer } from './themers/communicatingClasses.ts';
import { layered } from './themers/layered.ts';
import { meanRecurrenceTimesThemer } from './themers/meanRecurrenceTimes.ts';
import { periodicityThemer } from './themers/periodicity.ts';
import { recurrentClassesThemer } from './themers/recurrentClasses.ts';
import { recurrentStatesThemer } from './themers/recurrentStates.ts';
import { stationaryDistributionThemer } from './themers/stationaryDistribution.ts';
import { transientStatesThemer } from './themers/transientStates.ts';
import { useChainDisabledState } from './useChainDisabledState.ts';
import { useMarkovChain } from './useMarkovChain.ts';

const yesNo = (answer: boolean | undefined) => {
  if (answer === undefined) return 'N/A';
  return answer ? 'Yes' : 'No';
};

export const lensChips = (graph: Graph, shell: Shell): LensChipDefinition[] => {
  const chain = useMarkovChain(graph);
  const chainDisabled = useChainDisabledState(shell, graph, chain);

  const requiresValidChain = (
    chip: LensChipDefinition,
  ): LensChipDefinition => ({
    ...chip,
    disabled: () => chainDisabled.value || disabledState(chip),
  });

  const transitionMatrix: LensChipDefinition = {
    lens: {
      id: 'transition-matrix',
      components: [
        {
          component: AdjacencyMatrix,
          position: 'center-right',
        },
      ],
    },
    label: 'Transition Matrix',
    tooltipLabel:
      'The weight of the edge from each row state to each column state.',
  };

  return [
    {
      lens: {
        id: 'communicating-classes',
        ...layered(
          communicatingClassesThemer(graph, chain.communicatingClasses),
        ),
      },
      label: {
        term: 'Communicating Classes',
        value: () => chain.communicatingClasses.value.length,
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
      label: {
        term: 'Reducible',
        value: () => yesNo(chain.isReducible.value),
      },
      tooltipLabel: definitions.reducible,
    },
    {
      lens: {
        id: 'recurrent-classes',
        ...layered(recurrentClassesThemer(graph, chain.recurrentClasses)),
      },
      label: {
        term: 'Recurrent Classes',
        value: () => chain.recurrentClasses.value.length,
      },
      tooltipLabel: definitions.recurrentClasses,
    },
    {
      lens: {
        id: 'recurrent-states',
        ...layered(recurrentStatesThemer(graph, chain.recurrentStates)),
      },
      label: {
        term: 'Recurrent States',
        value: () => chain.recurrentStates.value.size,
      },
      tooltipLabel: definitions.recurrentStates,
    },
    {
      lens: {
        id: 'transient-states',
        ...layered(transientStatesThemer(graph, chain.transientStates)),
      },
      label: {
        term: 'Transient States',
        value: () => chain.transientStates.value.size,
      },
      tooltipLabel: definitions.transientStates,
    },
    {
      lens: {
        id: 'absorbing-states',
        ...layered(absorbingStatesThemer(graph, chain.absorbingStates)),
      },
      label: {
        term: 'Absorbing States',
        value: () => chain.absorbingStates.value.size,
      },
      tooltipLabel: definitions.absorbingStates,
    },
    {
      lens: {
        id: 'absorbing-chain',
        ...layered(absorbingStatesThemer(graph, chain.absorbingStates)),
      },
      label: {
        term: 'Absorbing Chain',
        value: () => yesNo(chain.isChainAbsorbing.value),
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
      label: { term: 'Periodic', value: () => yesNo(chain.isPeriodic.value) },
      tooltipLabel: definitions.periodic,
    },
    {
      lens: {
        id: 'ergodic',
        ...layered(
          communicatingClassesThemer(graph, chain.communicatingClasses),
        ),
      },
      label: { term: 'Ergodic', value: () => yesNo(chain.isErgodic.value) },
      tooltipLabel: definitions.ergodic,
    },
    {
      lens: { id: 'doubly-stochastic' },
      label: {
        term: 'Doubly Stochastic',
        value: () => yesNo(chain.isDoublyStochastic.value),
      },
      tooltipLabel: definitions.doublyStochastic,
    },
    {
      lens: { id: 'reversible' },
      label: {
        term: 'Reversible',
        value: () => yesNo(chain.isReversible.value),
      },
      disabled: () =>
        chain.isReducible.value && {
          reason:
            'Needs an irreducible chain. A transient state holds none of the distribution, so detailed balance would pass over its one way transitions.',
        },
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
      label: {
        term: 'Stationary Distribution',
        value: () =>
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
      label: {
        term: 'Limiting Distribution',
        value: () => yesNo(chain.convergesToStationaryDistribution.value),
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
      label: () => 'Mean Recurrence Time',
      tooltipLabel: definitions.meanRecurrenceTime,
    },
    transitionMatrix,
  ].map(requiresValidChain);
};
