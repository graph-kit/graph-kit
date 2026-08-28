import { Graph } from '@magic/shared/graph';

import { useChainProperties } from './computations/useChainProperties.ts';
import { useChainValidity } from './computations/useChainValidity.ts';
import { useCommunicatingClasses } from './computations/useCommunicatingClasses.ts';
import { usePeriodicity } from './computations/usePeriodicity.ts';
import { useStateClassification } from './computations/useStateClassification.ts';

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

  const { isReducible, isChainAbsorbing, isErgodic } = useChainProperties(
    communicatingClasses,
    recurrentClasses,
    isPeriodic,
  );

  const { invalidStates, isValid } = useChainValidity(graph);

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
    invalidStates,
    isValid,
  };
};
