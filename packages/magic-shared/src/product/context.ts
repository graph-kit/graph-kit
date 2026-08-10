import { nullThrows } from '@core/utils/assert';

import { inject, provide } from 'vue';

import { Graph } from '../graph/index.ts';
import { Magic, MagicGraph } from './types.ts';

const GRAPH_KEY = 'PRODUCT_GRAPH';
const MAGIC_KEY = 'MAGIC_PRODUCT';

export const provideGraph = (graph: Graph) => {
  provide(GRAPH_KEY, graph);
};

export const useProvidedGraph = () => {
  return nullThrows(inject<Graph>(GRAPH_KEY), 'graph not provided!');
};

export const provideMagic = (magic: Magic) => {
  provide(MAGIC_KEY, magic);
};

export const useProvidedMagic = () => {
  return nullThrows(inject<Magic>(MAGIC_KEY), 'magic not provided!');
};

/**
 * @deprecated backwards compatibility shim from the harness migration. reach for
 * `useProvidedGraph` and `useProvidedMagic` separately instead, see issue #845
 */
export const useProvidedMagicGraph = (): MagicGraph => {
  const magic = useProvidedMagic();
  const graph = useProvidedGraph();
  return { ...graph, magic };
};
