import { EventMapToEventRegistry } from '@core/events/types';
import { CoreNode } from '@graph/primitives/types';

import { NodeAnchor } from './types.ts';

export type AnchorsEventMap = {
  /**
   * when the user initiates a drag on a node anchor
   */
  onNodeAnchorDragStart: (
    parentNode: CoreNode,
    nodeAnchor: Readonly<NodeAnchor>,
  ) => void;
  /**
   * when the user drops a node anchor
   */
  onNodeAnchorDrop: (
    parentNode: CoreNode,
    nodeAnchor: Readonly<NodeAnchor>,
  ) => void;
};

type AnchorsEventRegistry = EventMapToEventRegistry<AnchorsEventMap>;

export const createAnchorsEventRegistry = (): AnchorsEventRegistry => ({
  onNodeAnchorDragStart: new Set(),
  onNodeAnchorDrop: new Set(),
});
