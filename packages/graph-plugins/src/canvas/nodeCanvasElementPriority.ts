import { nullThrows } from '@core/utils/assert';

import {
  NodePaintPriorityOptions,
  getNodePaintPriorities,
} from './nodePaintPriority.ts';

const BASE_NODE_PRIORITY = 2;

export const createNodeCanvasElementPriorityGetter = (
  options: NodePaintPriorityOptions,
) => {
  // TODO for perf reasons we need to be pre-computing these only once on every draw cycle!
  return (nodeId: string) => {
    const paintPriority = nullThrows(
      getNodePaintPriorities(options).get(nodeId),
      `could not resolve paint priority from node with id: ${nodeId}`,
    );
    return paintPriority + BASE_NODE_PRIORITY;
  };
};
