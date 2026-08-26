import { createEventHub } from '@core/events/createEventHub';
import { DraggedElement } from '@multiplayer/protocol/room';

import { Graph } from '../../graph/types.ts';
import { DragEventMap } from '../../product/types.ts';

/**
 * Turns the graph's node drag into the three moments the room cares about. Positions are
 * read at the moment each one is announced rather than accumulated: only the live one
 * matters, and it is already in the store.
 */
export type DraggedNodes = {
  /** for the wire */
  events: ReturnType<typeof createEventHub<DragEventMap>>;
  /** for deciding whose move wins on a node two people have hold of */
  isDragging: (nodeId: string) => boolean;
};

export const trackDraggedNodes = (graph: Graph): DraggedNodes => {
  let draggedNodeIds = new Set<string>();

  const events = createEventHub<DragEventMap>({
    onDragStarted: new Set(),
    onDragMoved: new Set(),
    onDragEnded: new Set(),
  });

  const elementsAt = (nodeIds: Iterable<string>): DraggedElement[] => {
    const elements: DraggedElement[] = [];
    for (const nodeId of nodeIds) {
      const { x, y } = graph.positions.presented.get(nodeId);
      elements.push({ id: nodeId, position: { x, y } });
    }
    return elements;
  };

  graph.nodeDrag.events.subscribe('onNodeDragStart', (nodes) => {
    draggedNodeIds = new Set(nodes.map((node) => node.id));
    events.emit('onDragStarted', elementsAt(draggedNodeIds));
  });

  graph.nodeDrag.events.subscribe('onNodeDragMove', () => {
    if (draggedNodeIds.size === 0) return;
    events.emit('onDragMoved', elementsAt(draggedNodeIds));
  });

  graph.nodeDrag.events.subscribe('onNodeDrop', () => {
    draggedNodeIds = new Set();
    events.emit('onDragEnded');
  });

  return {
    events,
    isDragging: (nodeId) => draggedNodeIds.has(nodeId),
  };
};
