import { nullThrows } from '@core/utils/assert';

import { inject, provide } from 'vue';

import { Graph } from '../graph/types.ts';

const GRAPH_KEY = 'GRAPH';

export const provideGraph = (graph: Graph) => {
  provide(GRAPH_KEY, graph);
};

export const useProvidedGraph = () => {
  return nullThrows(inject<Graph>(GRAPH_KEY), 'graph not provided!');
};
