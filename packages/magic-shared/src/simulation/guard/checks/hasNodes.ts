import { Graph } from '../../../graph/types.ts';
import { GuardCheck } from '../SimulationGuardBuilder.ts';

export const createHasNodeCheck =
  (graph: Graph, minNodes: number): GuardCheck =>
  () => {
    const nodeCount = graph.nodes.value.length;
    if (nodeCount >= minNodes) return;
    return {
      id: 'min-nodes',
      explainer: {
        content: `Need at least ${minNodes} node${minNodes === 1 ? '' : 's'}. Graph has ${nodeCount} node${nodeCount === 1 ? '' : 's'}!`,
      },
    };
  };
