import { mergeSetArrayIntoSet } from '@core/utils/sets';
import { GNode, Graph } from '@magic/shared/graph';

import { ComputedRef, computed } from 'vue';

import { CommunicatingClass } from './useCommunicatingClasses.ts';

export const getRecurrentClasses = (classes: CommunicatingClass[]) =>
  classes
    .filter((communicatingClass) => communicatingClass.closed)
    .map((communicatingClass) => communicatingClass.states);

export const getTransientStates = (
  stateIds: GNode['id'][],
  recurrentStates: Set<GNode['id']>,
) => new Set(stateIds.filter((stateId) => !recurrentStates.has(stateId)));

/** a recurrent class of one is a state whose only transition is back to itself */
export const getAbsorbingStates = (recurrentClasses: Set<GNode['id']>[]) =>
  mergeSetArrayIntoSet(
    recurrentClasses.filter((recurrentClass) => recurrentClass.size === 1),
  );

export const useStateClassification = (
  graph: Graph,
  communicatingClasses: ComputedRef<CommunicatingClass[]>,
) => {
  const recurrentClasses = computed(() =>
    getRecurrentClasses(communicatingClasses.value),
  );

  const recurrentStates = computed(() =>
    mergeSetArrayIntoSet(recurrentClasses.value),
  );

  const transientStates = computed(() =>
    getTransientStates(
      graph.nodes.value.map((node) => node.id),
      recurrentStates.value,
    ),
  );

  const absorbingStates = computed(() =>
    getAbsorbingStates(recurrentClasses.value),
  );

  return {
    recurrentClasses,
    recurrentStates,
    transientStates,
    absorbingStates,
  };
};
