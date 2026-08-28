import { nullThrows } from '@core/utils/assert';
import { gcd } from '@core/utils/math';
import { GNode, Graph } from '@magic/shared/graph';

import { ComputedRef, computed } from 'vue';

type Adjacency = Readonly<Record<GNode['id'], readonly GNode['id'][]>>;

/**
 * distance of every state in the class from `start`, staying inside the class so a
 * transition that leaves it cannot shorten a distance
 */
export const levelStates = (
  start: GNode['id'],
  states: Set<GNode['id']>,
  adjacency: Adjacency,
) => {
  const levels = new Map<GNode['id'], number>([[start, 0]]);
  const queue = [start];

  let cursor = 0;
  while (cursor < queue.length) {
    const state = queue[cursor];
    cursor++;

    const level = nullThrows(
      levels.get(state),
      'state was queued before it was leveled',
    );

    for (const neighbor of adjacency[state] ?? []) {
      if (!states.has(neighbor) || levels.has(neighbor)) continue;
      levels.set(neighbor, level + 1);
      queue.push(neighbor);
    }
  }

  return levels;
};

export const getClassPeriod = (
  states: Set<GNode['id']>,
  adjacency: Adjacency,
) => {
  if (states.size === 0) return 0;

  const [start] = states;
  const levels = levelStates(start, states, adjacency);

  let period = 0;
  for (const [state, level] of levels) {
    for (const neighbor of adjacency[state] ?? []) {
      const neighborLevel = levels.get(neighbor);
      if (neighborLevel === undefined) continue;
      period = gcd(period, level + 1 - neighborLevel);
    }
  }

  return period;
};

/**
 * one class being periodic is enough, since the chain does not settle while any part of
 * it is still cycling
 */
export const isChainPeriodic = (periods: number[]) =>
  periods.some((period) => period > 1);

export const usePeriodicity = (
  graph: Graph,
  recurrentClasses: ComputedRef<Set<GNode['id']>[]>,
) => {
  const recurrentClassPeriods = computed(() =>
    recurrentClasses.value.map((recurrentClass) =>
      getClassPeriod(recurrentClass, graph.adjacencyLists.directed.value),
    ),
  );

  const isPeriodic = computed(() =>
    isChainPeriodic(recurrentClassPeriods.value),
  );

  return { recurrentClassPeriods, isPeriodic };
};
