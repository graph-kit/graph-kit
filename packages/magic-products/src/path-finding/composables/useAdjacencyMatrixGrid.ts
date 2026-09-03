import { GEdge, GNode, Graph } from '@magic/shared/graph';

import { ComputedRef, computed } from 'vue';

export type AdjacencyMatrixGrid = {
  /** node ids, ordered by label, shared by both rows and columns */
  nodeIds: ComputedRef<GNode['id'][]>;
  /** grid[fromIndex][toIndex] is the edge from nodeIds[fromIndex] to nodeIds[toIndex], or undefined if none exists */
  grid: ComputedRef<(GEdge | undefined)[][]>;
};

export const useAdjacencyMatrixGrid = (graph: Graph): AdjacencyMatrixGrid => {
  const nodeIds = computed(() =>
    graph.nodes.value
      .map((node) => node.id)
      .toSorted((a, b) =>
        graph.getNode(a).label.localeCompare(graph.getNode(b).label),
      ),
  );

  const edgeByPair = computed(() => {
    const map = new Map<string, GEdge>();
    graph.edges.value.forEach((edge) => {
      map.set(`${edge.source}->${edge.target}`, edge);
      if (!graph.metadata.directed)
        map.set(`${edge.target}->${edge.source}`, edge);
    });
    return map;
  });

  const grid = computed(() =>
    nodeIds.value.map((fromId) =>
      nodeIds.value.map((toId) => edgeByPair.value.get(`${fromId}->${toId}`)),
    ),
  );

  return { nodeIds, grid };
};
