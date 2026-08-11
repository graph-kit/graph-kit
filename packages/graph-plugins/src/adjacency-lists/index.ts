import { computed } from '@reactive/primitives/index';

import {
  AdjacencyList,
  AdjacencyListsPlugin,
  Graph,
  WeightedAdjacencyList,
} from './types.ts';

const getDirectedGraphAdjacencyList = (graph: Graph) => {
  return graph.nodes().reduce<AdjacencyList>((acc, node) => {
    acc[node.id] = graph
      .edges()
      .filter((edge) => edge.source === node.id)
      .map((edge) => edge.target);
    return acc;
  }, {});
};

const getUndirectedGraphAdjacencyList = (graph: Graph) => {
  return graph.nodes().reduce<AdjacencyList>((acc, node) => {
    acc[node.id] = graph
      .edges()
      .filter((edge) => edge.source === node.id || edge.target === node.id)
      .map((edge) => {
        return edge.source === node.id ? edge.target : edge.source;
      });
    return acc;
  }, {});
};

/**
 * creates an adjacency list mapping node ids to the node ids of their neighbors
 *
 * @param graph the graph instance
 * @returns an adjacency list using ids of nodes as keys
 * @example getAdjacencyList(graph)
 * // { 'abc123': ['def456'], 'def456': ['abc123'] }
 */
export const getAdjacencyList = (graph: Graph) => {
  const { directed: isGraphDirected } = graph.metadata;
  const fn = isGraphDirected
    ? getDirectedGraphAdjacencyList
    : getUndirectedGraphAdjacencyList;
  return fn(graph);
};

/**
 * creates an adjacency list mapping node ids to nodes along with a added field `weight` that
 * represents the weight of the edge connecting them
 *
 * @param graph the graph instance
 * @returns an adjacency list using ids of nodes as keys and the full node objects with weights as values
 * @example getWeightedAdjacencyList(graph)
 * // {
 * //   'abc123': [{ id: 'def456', weight: 1 }],
 * //   'def456': [{ id: 'abc123', weight: 1 }]
 * // }
 */
export const getWeightedAdjacencyList = (
  graph: Graph,
): WeightedAdjacencyList => {
  const { directed: isGraphDirected } = graph.metadata;

  const nodeById = new Map(graph.nodes().map((node) => [node.id, node]));

  const adjList: WeightedAdjacencyList = {};
  for (const nodeId of nodeById.keys()) adjList[nodeId] = [];

  const addNeighbor = (
    fromNodeId: string,
    toNodeId: string,
    weight: WeightedAdjacencyList[string][number]['weight'],
  ) => {
    const neighbors = adjList[fromNodeId];
    const toNode = nodeById.get(toNodeId);
    // an edge can outlive an endpoint, and joins no one until both exist
    if (!neighbors || !toNode) return;
    neighbors.push({ ...toNode, weight });
  };

  /*
    walked edge by edge rather than looking an edge back up per neighbor.
    getEdgeBetween finds the first edge joining a pair, so every parallel edge
    between the same two nodes used to report the first one's weight
  */
  for (const edge of graph.edges()) {
    const { weight } = graph.getEdge(edge.id);

    addNeighbor(edge.source, edge.target, weight);

    // a self loop makes one neighbor, not two
    const isSelfLoop = edge.source === edge.target;
    if (!isGraphDirected && !isSelfLoop) {
      addNeighbor(edge.target, edge.source, weight);
    }
  }

  return adjList;
};

export const adjacencyLists: AdjacencyListsPlugin = ({
  controls,
  events,
  getters,
}) => {
  const graph: Graph = {
    ...controls,
    ...getters,
    events,
  };

  const standard = computed(() => getAdjacencyList(graph));
  const weighted = computed(() => getWeightedAdjacencyList(graph));
  const directed = computed(() => getDirectedGraphAdjacencyList(graph));
  const undirected = computed(() => getUndirectedGraphAdjacencyList(graph));

  return {
    name: 'adjacencyLists',
    controls: {
      standard,
      weighted,
      directed,
      undirected,
    },
  };
};
