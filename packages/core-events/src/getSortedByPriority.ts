import { HandlerPriority } from './createEventHandler.ts';

const matches = (target: string, id: string | undefined) => {
  if (!id) return false;
  return id === target || id.startsWith(`${target}:`);
};

export const getSortedByPriority = <
  SortableItem extends { id: string | undefined; priority: HandlerPriority },
>(
  array: SortableItem[],
): SortableItem[] => {
  const inDegree = new Map(array.map((_, i) => [i, 0]));

  for (let i = 0; i < array.length; i++) {
    for (const target of array[i].priority.before) {
      for (let j = 0; j < array.length; j++) {
        if (i !== j && matches(target, array[j].id)) {
          inDegree.set(j, inDegree.get(j)! + 1);
        }
      }
    }
  }

  const queue = array.map((_, i) => i).filter((i) => inDegree.get(i) === 0);
  const sortedIndices: number[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    sortedIndices.push(current);
    for (const target of array[current].priority.before) {
      for (let j = 0; j < array.length; j++) {
        if (current !== j && matches(target, array[j].id)) {
          const deg = inDegree.get(j)! - 1;
          inDegree.set(j, deg);
          if (deg === 0) queue.push(j);
        }
      }
    }
  }

  // cycle fallback: append remaining in original order
  if (sortedIndices.length < array.length) {
    const seen = new Set(sortedIndices);
    const cycleIds = array
      .filter((_, i) => !seen.has(i))
      .map((item) => item.id ?? '(anonymous)');
    console.warn(
      `[getSortedByPriority] Cycle detected among handlers: ${cycleIds.join(', ')}. Falling back to registration order.`,
    );
    for (let i = 0; i < array.length; i++) {
      if (!seen.has(i)) sortedIndices.push(i);
    }
  }

  return sortedIndices.map((i) => array[i]);
};
