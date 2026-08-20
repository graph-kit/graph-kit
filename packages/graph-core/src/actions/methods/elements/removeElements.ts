import { CreateCoreAction } from '../../types.ts';

export const createRemoveElementsHandler: CreateCoreAction<'removeElements'> =
  ({ commitTransaction }) =>
  ({ nodes, edges }) => {
    const { removedNodeIds, removedEdgeIds } = commitTransaction({
      removeNodeIds: nodes.map((n) => n.id),
      removeEdgeIds: edges.map((e) => e.id),
    });

    return { removedNodeIds, removedEdgeIds };
  };
