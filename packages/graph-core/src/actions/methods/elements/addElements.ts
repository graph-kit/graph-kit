import { generateId } from '@core/utils/id';

import { CreateCoreAction } from '../../types.ts';

export const createAddElementsHandler: CreateCoreAction<'addElements'> =
  ({ commitTransaction }) =>
  ({ nodes = [], edges = [] }) => {
    const newNodes = nodes.map((n) => ({
      id: generateId(),
      ...n,
    }));
    const newEdges = edges.map((e) => ({
      id: generateId(),
      ...e,
    }));

    const { addedEdges, addedNodes } = commitTransaction({
      addNodes: newNodes,
      addEdges: newEdges,
    });

    return { addedEdges, addedNodes };
  };
