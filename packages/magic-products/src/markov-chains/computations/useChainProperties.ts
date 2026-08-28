import { GNode, Graph } from '@magic/shared/graph';
import Fraction from 'fraction.js';

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

/**
 * irreducible and aperiodic. some texts call this a regular chain and keep `ergodic` for
 * irreducible alone, so anything shown under this name has to say which it means
 */
export const isErgodic = (
  communicatingClasses: CommunicatingClass[],
  periodic: boolean,
) => communicatingClasses.length === 1 && !periodic;

/**
 * validity already puts every row at 1, so the columns are the open question: a chain
 * that also leaves each state as often as it enters holds an even distribution
 */
export const isDoublyStochastic = (matrix: Fraction[][], valid: boolean) => {
  if (!valid || matrix.length === 0) return false;

  for (let column = 0; column < matrix.length; column++) {
    let total = new Fraction(0);
    for (const row of matrix) total = total.add(row[column]);
    if (!total.equals(1)) return false;
  }

  return true;
};

export const useChainProperties = (
  graph: Graph,
  communicatingClasses: ComputedRef<CommunicatingClass[]>,
  recurrentClasses: ComputedRef<Set<GNode['id']>[]>,
  isPeriodic: ComputedRef<boolean>,
  isValid: ComputedRef<boolean>,
) => ({
  isReducible: computed(() => isReducible(communicatingClasses.value)),
  isChainAbsorbing: computed(() => isAbsorbing(recurrentClasses.value)),
  isErgodic: computed(() =>
    isErgodic(communicatingClasses.value, isPeriodic.value),
  ),
  isDoublyStochastic: computed(() =>
    isDoublyStochastic(graph.transitionMatrix.value, isValid.value),
  ),
});
