import { GNode } from '@magic/shared/graph';
import Fraction from 'fraction.js';

import { ComputedRef, computed } from 'vue';

/**
 * a state holding a third of the distribution is one the chain sits on every third step,
 * so it returns every three. a state the chain leaves for good never returns at all
 */
export const toMeanRecurrenceTimes = (
  distribution: Map<GNode['id'], Fraction>,
) => {
  const times = new Map<GNode['id'], Fraction | undefined>();

  for (const [stateId, share] of distribution) {
    times.set(stateId, share.equals(0) ? undefined : share.inverse());
  }

  return times;
};

export const useMeanRecurrenceTimes = (
  stationaryDistribution: ComputedRef<Map<GNode['id'], Fraction> | undefined>,
) =>
  computed(() => {
    const distribution = stationaryDistribution.value;
    return distribution && toMeanRecurrenceTimes(distribution);
  });
