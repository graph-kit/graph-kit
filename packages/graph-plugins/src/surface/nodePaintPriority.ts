import { CoreNode } from '@graph/primitives/types';

import { NodePaintOrder } from './nodePaintOrder.ts';

export type NodePaintPriorityOptions = {
  nodes: () => readonly CoreNode[];
  paintOrder: NodePaintOrder;
};

/**
 * Where each node sits within the node band, as a fraction, so the canvas can order
 * nodes among themselves without colliding with any other element type's priority.
 */
export const getNodePaintPriorities = ({
  nodes: readNodes,
  paintOrder,
}: NodePaintPriorityOptions) => {
  const nodes = readNodes();
  const priorities = new Map<string, number>();
  if (nodes.length === 0) return priorities;

  const increment = 1 / nodes.length;

  // a stable sort, so nodes nobody has hovered keep the order the graph reports them in
  const nodesSortedByPaintOrder = nodes.toSorted((a, b) => {
    return paintOrder.of(a.id) - paintOrder.of(b.id);
  });

  for (let i = 0; i < nodesSortedByPaintOrder.length; i++) {
    priorities.set(nodesSortedByPaintOrder[i].id, increment * i);
  }

  return priorities;
};
