import { DraggedElement } from '@multiplayer/protocol/room';

import { Graph } from '../graph/types.ts';

/**
 * Every node a drag is carrying, which is the whole selection when one was grabbed out
 * of a marquee. Positions are read on demand rather than accumulated: only the live one
 * matters, and it is already in the store.
 */
export type DraggedNodes = {
  /** for the wire */
  elements: () => DraggedElement[];
  /** for deciding whose move wins on a node two people have hold of */
  isDragging: (nodeId: string) => boolean;
};

export const trackDraggedNodes = (graph: Graph): DraggedNodes => {
  let draggedNodeIds = new Set<string>();

  graph.nodeDrag.events.subscribe('onNodeDragStart', (nodes) => {
    draggedNodeIds = new Set(nodes.map((node) => node.id));
  });

  graph.nodeDrag.events.subscribe('onNodeDrop', () => {
    draggedNodeIds = new Set();
  });

  return {
    elements: () =>
      [...draggedNodeIds].map((nodeId) => {
        const { x, y } = graph.positions.get(nodeId);
        return { id: nodeId, position: { x, y } };
      }),
    isDragging: (nodeId) => draggedNodeIds.has(nodeId),
  };
};
