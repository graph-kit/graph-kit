import { nullThrows } from '@core/utils/assert';
import { GNode, Graph } from '@magic/shared/graph';

import { computed } from 'vue';

export type CommunicatingClass = {
  /** states that all reach each other, so they share every property below */
  states: Set<GNode['id']>;
  /** no transition leaves the class, which is what makes a class recurrent */
  closed: boolean;
};

export const toCommunicatingClasses = (
  components: Pick<GNode, 'id'>[][],
  componentAdjacency: Map<number, Set<number>>,
): CommunicatingClass[] =>
  components.map((component, index) => ({
    states: new Set(component.map((node) => node.id)),
    closed:
      nullThrows(
        componentAdjacency.get(index),
        'component absent from the adjacency map it was built alongside',
      ).size === 0,
  }));

export const useCommunicatingClasses = (graph: Graph) =>
  computed(() => {
    const { components, componentAdjacencyMap } =
      graph.characteristics.sccs.value;
    return toCommunicatingClasses(components, componentAdjacencyMap);
  });
