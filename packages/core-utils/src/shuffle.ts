/**
 * Returns a new array with the items shuffled in random order, using the
 * Fisher–Yates (Knuth) shuffle algorithm.
 *
 * The original array is not mutated.
 *
 * @typeParam T - The type of items in the array.
 * @param items - The array of items to shuffle.
 * @returns A new array containing the same items in random order.
 *
 * @example
 * ```ts
 * const shuffledEdges = shuffleItems(edges);
 * const shuffledNumbers = shuffleItems([1, 2, 3, 4, 5]);
 * ```
 */
export const shuffleItems = <T>(items: T[]): T[] => {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};
