import { Graph } from '@magic/shared/graph';

import { useChainProperties } from './computations/useChainProperties.ts';
import { useChainValidity } from './computations/useChainValidity.ts';
import { useCommunicatingClasses } from './computations/useCommunicatingClasses.ts';
import { useMeanRecurrenceTimes } from './computations/useMeanRecurrenceTimes.ts';
import { usePeriodicity } from './computations/usePeriodicity.ts';
import { useReversibility } from './computations/useReversibility.ts';
import { useStateClassification } from './computations/useStateClassification.ts';
import { useStationaryDistribution } from './computations/useStationaryDistribution.ts';

export const useMarkovChain = (graph: Graph) => {
  const communicatingClasses = useCommunicatingClasses(graph);

  const {
    recurrentClasses,
    recurrentStates,
    transientStates,
    absorbingStates,
  } = useStateClassification(graph, communicatingClasses);

  const { recurrentClassPeriods, isPeriodic } = usePeriodicity(
    graph,
    recurrentClasses,
  );

  const { outboundTotals, invalidStates, isValid } = useChainValidity(graph);

  const { isReducible, isChainAbsorbing, isErgodic, isDoublyStochastic } =
    useChainProperties(
      graph,
      communicatingClasses,
      recurrentClasses,
      isPeriodic,
      isValid,
    );

  const {
    hasUniqueStationaryDistribution,
    convergesToStationaryDistribution,
    stationaryDistribution,
  } = useStationaryDistribution(
    graph,
    recurrentClasses,
    recurrentClassPeriods,
    isValid,
  );

  const meanRecurrenceTimes = useMeanRecurrenceTimes(stationaryDistribution);
  const isReversible = useReversibility(
    graph,
    stationaryDistribution,
    isReducible,
  );

  return {
    communicatingClasses,
    recurrentClasses,
    recurrentStates,
    transientStates,
    absorbingStates,
    recurrentClassPeriods,
    isPeriodic,
    isReducible,
    isChainAbsorbing,
    isErgodic,
    isDoublyStochastic,
    outboundTotals,
    invalidStates,
    isValid,
    hasUniqueStationaryDistribution,
    convergesToStationaryDistribution,
    stationaryDistribution,
    meanRecurrenceTimes,
    isReversible,
  };
};
