// the graph flavored half of the harness: everything that knows it is hosting a graph
export { useGraphProduct } from './useGraphProduct.ts';
export type {
  GraphLensChipOption,
  GraphProductOptions,
  MagicGraph,
} from './types.ts';

export {
  provideGraph,
  useProvidedGraph,
  useProvidedMagicGraph,
} from './context.ts';
