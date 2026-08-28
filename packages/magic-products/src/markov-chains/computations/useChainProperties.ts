import { GNode } from '@magic/shared/graph';

import { ComputedRef, computed } from 'vue';

import { CommunicatingClass } from './useCommunicatingClasses.ts';

export const isReducible = (communicatingClasses: CommunicatingClass[]) =>
  communicatingClasses.length > 1;

/**
 * every recurrent class being a single state is what makes a chain absorbing: wherever
 * it starts, it ends somewhere it can never leave
 */
export const isAbsorbing = (recurrentClasses: Set<GNode['id']>[]) =>
  recurrentClasses.length > 0 &&
  recurrentClasses.every((recurrentClass) => recurrentClass.size === 1);

/** irreducible and aperiodic, the pair that gives a chain one steady state it always reaches */
export const isErgodic = (
  communicatingClasses: CommunicatingClass[],
  periodic: boolean,
) => communicatingClasses.length === 1 && !periodic;

export const useChainProperties = (
  communicatingClasses: ComputedRef<CommunicatingClass[]>,
  recurrentClasses: ComputedRef<Set<GNode['id']>[]>,
  isPeriodic: ComputedRef<boolean>,
) => ({
  isReducible: computed(() => isReducible(communicatingClasses.value)),
  isChainAbsorbing: computed(() => isAbsorbing(recurrentClasses.value)),
  isErgodic: computed(() =>
    isErgodic(communicatingClasses.value, isPeriodic.value),
  ),
});
