import { computed } from '@reactive/primitives/index';
import Fraction from 'fraction.js';

import {
  TransitionMatrix,
  TransitionMatrixGraph,
  TransitionMatrixPlugin,
} from './types.ts';

/**
 * builds the matrix straight from the node and edge lists.
 *
 * rows and columns are indexed by position in `nodes()`, which is the same
 * order `nodeIdToIndex` reports, so the matrix and any index taken against it
 * come from one list rather than two that have to be trusted to agree
 */
export const getTransitionMatrix = (
  graph: TransitionMatrixGraph,
): TransitionMatrix => {
  const nodes = graph.nodes();
  const nodeCount = nodes.length;

  const indexOfNode = new Map(nodes.map((node, index) => [node.id, index]));

  const matrix: TransitionMatrix = Array.from({ length: nodeCount }, () =>
    Array.from({ length: nodeCount }, () => new Fraction(0)),
  );

  const { directed } = graph.metadata;

  for (const edge of graph.edges()) {
    const fromIndex = indexOfNode.get(edge.source);
    const toIndex = indexOfNode.get(edge.target);

    // an edge can outlive an endpoint, and contributes nothing until both exist
    if (fromIndex === undefined || toIndex === undefined) continue;

    const { weight } = graph.getEdge(edge.id);

    matrix[fromIndex][toIndex] = weight;
    if (!directed) matrix[toIndex][fromIndex] = weight;
  }

  return matrix;
};

export const transitionMatrix: TransitionMatrixPlugin = ({
  controls,
  getters,
}) => ({
  name: 'transitionMatrix',
  controls: computed(() => getTransitionMatrix({ ...controls, ...getters })),
});
