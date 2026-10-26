import { nullThrows } from '@core/utils/assert';
import { GNode, Graph } from '@magic/shared/graph';

import { computed } from 'vue';

export const useInDegrees = (graph: Graph) =>
  computed(() => {
    const inDegrees = new Map<GNode['id'], number>(
      graph.nodes.value.map((node) => [node.id, 0]),
    );
    for (const { target } of graph.edges.value) {
      const inDegree = nullThrows(
        inDegrees.get(target),
        'edge target is not a node',
      );
      inDegrees.set(target, inDegree + 1);
    }
    return inDegrees;
  });
