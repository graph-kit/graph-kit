import { DraggedElement } from '@multiplayer/protocol/room';

import { Graph } from '../graph/types.ts';

/**
 * The node under the cursor for as long as it is being dragged, read on demand rather
 * than accumulated: only the live position matters, and it is already in the store.
 *
 * A multi node drag reports the one that was grabbed. The rest move with it, and a peer
 * finds that out when the move commits.
 */
export const trackDraggedNode = (
  graph: Graph,
): (() => DraggedElement | null) => {
  let draggedNodeId: string | null = null;

  graph.nodeDrag.events.subscribe('onNodeDragStart', (nodes) => {
    draggedNodeId = nodes[0]?.id ?? null;
  });

  graph.nodeDrag.events.subscribe('onNodeDrop', () => {
    draggedNodeId = null;
  });

  return () => {
    if (draggedNodeId === null) return null;
    const { x, y } = graph.positions.get(draggedNodeId);
    return { id: draggedNodeId, position: { x, y } };
  };
};
