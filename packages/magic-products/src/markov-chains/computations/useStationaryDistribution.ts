import { assert } from '@core/utils/assert';
import { GNode, Graph } from '@magic/shared/graph';
import Fraction from 'fraction.js';

import { ComputedRef, computed } from 'vue';

export type ClassSystem = {
  /** the class states in matrix order, so a solution lines up with them by index */
  states: GNode['id'][];
  matrix: Fraction[][];
};

export const isStationaryDistributionUnique = (
  recurrentClasses: Set<GNode['id']>[],
  valid: boolean,
) => valid && recurrentClasses.length === 1;

/**
 * a periodic chain never reaches the distribution it is unique in having, since it keeps
 * cycling through the same states rather than spreading across them
 */
export const isStationaryDistributionReached = (
  recurrentClassPeriods: number[],
  unique: boolean,
) => unique && recurrentClassPeriods[0] === 1;

export const toClassSystem = (
  matrix: Fraction[][],
  stateIds: GNode['id'][],
  classStates: Set<GNode['id']>,
): ClassSystem => {
  const indices: number[] = [];
  for (const [index, stateId] of stateIds.entries()) {
    if (classStates.has(stateId)) indices.push(index);
  }

  return {
    states: indices.map((index) => stateIds[index]),
    matrix: indices.map((row) => indices.map((column) => matrix[row][column])),
  };
};

/**
 * solves pP = p over the class, which is n balance equations that always carry one
 * redundancy, so the last is dropped for the requirement that the whole thing sums to 1.
 *
 * elimination stays in fraction form, so the answer comes back as the exact thirds and
 * sevenths a chain like this produces rather than a decimal near them
 */
export const solveStationaryDistribution = (matrix: Fraction[][]) => {
  const size = matrix.length;

  const system = matrix.map((_, row) =>
    row === size - 1
      ? [...matrix.map(() => new Fraction(1)), new Fraction(1)]
      : [
          ...matrix.map((sourceRow, source) =>
            source === row ? sourceRow[row].sub(1) : sourceRow[row],
          ),
          new Fraction(0),
        ],
  );

  for (let column = 0; column < size; column++) {
    const pivotRow = system.findIndex(
      (row, index) => index >= column && !row[column].equals(0),
    );
    assert(
      pivotRow !== -1,
      'class has no unique stationary distribution, so it was never one recurrent class',
    );

    [system[column], system[pivotRow]] = [system[pivotRow], system[column]];

    const pivot = system[column][column];
    system[column] = system[column].map((entry) => entry.div(pivot));

    for (const [index, row] of system.entries()) {
      if (index === column || row[column].equals(0)) continue;
      const factor = row[column];
      system[index] = row.map((entry, position) =>
        entry.sub(factor.mul(system[column][position])),
      );
    }
  }

  return system.map((row) => row[size]);
};

/** every state outside the recurrent class is left behind, so the chain never sits on it */
export const toDistribution = (
  stateIds: GNode['id'][],
  classStates: GNode['id'][],
  solution: Fraction[],
) => {
  const distribution = new Map<GNode['id'], Fraction>(
    stateIds.map((stateId) => [stateId, new Fraction(0)]),
  );

  for (const [index, stateId] of classStates.entries()) {
    distribution.set(stateId, solution[index]);
  }

  return distribution;
};

export const useStationaryDistribution = (
  graph: Graph,
  recurrentClasses: ComputedRef<Set<GNode['id']>[]>,
  recurrentClassPeriods: ComputedRef<number[]>,
  isValid: ComputedRef<boolean>,
) => {
  const hasUniqueStationaryDistribution = computed(() =>
    isStationaryDistributionUnique(recurrentClasses.value, isValid.value),
  );

  const convergesToStationaryDistribution = computed(() =>
    isStationaryDistributionReached(
      recurrentClassPeriods.value,
      hasUniqueStationaryDistribution.value,
    ),
  );

  const stationaryDistribution = computed(() => {
    if (!hasUniqueStationaryDistribution.value) return undefined;

    const [recurrentClass] = recurrentClasses.value;
    const stateIds = graph.nodes.value.map((node) => node.id);
    const system = toClassSystem(
      graph.transitionMatrix.value,
      stateIds,
      recurrentClass,
    );

    return toDistribution(
      stateIds,
      system.states,
      solveStationaryDistribution(system.matrix),
    );
  });

  return {
    hasUniqueStationaryDistribution,
    convergesToStationaryDistribution,
    stationaryDistribution,
  };
};
