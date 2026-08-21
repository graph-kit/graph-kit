import { EventMapToEventRegistry } from '@core/events/types';
import { CoreNode } from '@graph/primitives/types';
import { DeepReadonly } from 'ts-essentials';

export type NodeDragEventMap = {
  /**
   * when a node drag is initiated
   */
  onNodeDragStart: (nodes: DeepReadonly<CoreNode[]>) => void;
  /**
   * every move a drag makes, which is the only signal carrying where the nodes are while
   * a gesture is still in flight. separate from the cursor, which moves for many reasons
   */
  onNodeDragMove: (nodes: DeepReadonly<CoreNode[]>) => void;
  /**
   * when a node drag is ended
   */
  onNodeDrop: (nodes: DeepReadonly<CoreNode[]>) => void;
};

type NodeDragEventRegistry = EventMapToEventRegistry<NodeDragEventMap>;

export const createNodeDragEventRegistry = (): NodeDragEventRegistry => ({
  onNodeDragStart: new Set(),
  onNodeDragMove: new Set(),
  onNodeDrop: new Set(),
});
