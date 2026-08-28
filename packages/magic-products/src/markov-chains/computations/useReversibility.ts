import { nullThrows } from '@core/utils/assert';
import { GNode, Graph } from '@magic/shared/graph';
import Fraction from 'fraction.js';

import { ComputedRef, computed } from 'vue';

/**
 * detailed balance: the chain crosses between each pair of states as often one way as the
 * other, which is what lets a recording of it run backwards without looking wrong
 */
export const satisfiesDetailedBalance = (
  matrix: Fraction[][],
  stateIds: GNode['id'][],
  distribution: Map<GNode['id'], Fraction>,
) => {
  for (const [row, stateId] of stateIds.entries()) {
    const share = nullThrows(
      distribution.get(stateId),
      'state holds no share of the distribution',
    );

    for (let column = row + 1; column < stateIds.length; column++) {
      const neighborShare = nullThrows(
        distribution.get(stateIds[column]),
        'state holds no share of the distribution',
      );

      const crossing = share.mul(matrix[row][column]);
      if (!crossing.equals(neighborShare.mul(matrix[column][row])))
        return false;
    }
  }

  return true;
};

/**
 * only asked of irreducible chains, the way the textbooks scope it. a transient state
 * holds none of the distribution, so detailed balance passes over it no matter which way
 * its transitions point, and a chain with a visible one way arrow would report reversible
 */
export const useReversibility = (
  graph: Graph,
  stationaryDistribution: ComputedRef<Map<GNode['id'], Fraction> | undefined>,
  isReducible: ComputedRef<boolean>,
) =>
  computed(() => {
    const distribution = stationaryDistribution.value;
    if (!distribution || isReducible.value) return undefined;

    return satisfiesDetailedBalance(
      graph.transitionMatrix.value,
      graph.nodes.value.map((node) => node.id),
      distribution,
    );
  });
