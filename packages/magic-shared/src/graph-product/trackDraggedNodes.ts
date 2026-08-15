import { DraggedElement } from '@multiplayer/protocol/room';

import { Graph } from '../graph/types.ts';

/**
 * Every node a drag is carrying, which is the whole selection when one was grabbed out
 * of a marquee. Positions are read on demand rather than accumulated: only the live one
 * matters, and it is already in the store.
 */
export const trackDraggedNodes = (graph: Graph): (() => DraggedElement[]) => {
  let draggedNodeIds: string[] = [];

  graph.nodeDrag.events.subscribe('onNodeDragStart', (nodes) => {
    draggedNodeIds = nodes.map((node) => node.id);
  });

  graph.nodeDrag.events.subscribe('onNodeDrop', () => {
    draggedNodeIds = [];
  });

  return () =>
    draggedNodeIds.map((nodeId) => {
      const { x, y } = graph.positions.get(nodeId);
      return { id: nodeId, position: { x, y } };
    });
};
