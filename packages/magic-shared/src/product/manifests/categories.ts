/**
 * the buckets the experiences menu groups products into, declared in the order the
 * groups are listed
 */
export const productCategories = {
  'graph-algorithms': 'Graph Algorithms',
  'discrete-math': 'Discrete Math',
  'data-structures': 'Data Structures',
} as const satisfies Record<string, string>;

export type ProductCategory = keyof typeof productCategories;
