import { Graph } from '@magic/shared/graph';

import { TreeNode } from '../tree/TreeNode.ts';

/**
 * convert a graph instance to a tree. returns the trees root node.
 * assumes the graph holds a valid binary tree.
 */
export const graphToTree = (graph: Graph): TreeNode | undefined => {
  const childIds = new Map<string, string[]>();
  const hasParent = new Set<string>();

  for (const edge of graph.edges.value) {
    childIds.set(edge.source, [
      ...(childIds.get(edge.source) ?? []),
      edge.target,
    ]);
    hasParent.add(edge.target);
  }

  const build = (id: string): TreeNode => {
    const node = new TreeNode({ id, value: Number(graph.getNode(id).label) });
    const { x } = graph.positions.get(id);

    for (const childId of childIds.get(id) ?? []) {
      const child = build(childId);
      // which side a child sits on is read off the layout rather than compared
      // by value, since duplicate values say nothing about where they came from
      if (graph.positions.get(childId).x < x) node.left = child;
      else node.right = child;
    }

    return node;
  };

  const root = graph.nodes.value.find(({ id }) => !hasParent.has(id));
  if (!root) return undefined;

  return build(root.id);
};
