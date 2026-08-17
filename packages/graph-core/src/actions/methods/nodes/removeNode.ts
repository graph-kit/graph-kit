import { CreateCoreAction } from '../../types.ts';

export const createRemoveNodeHandler: CreateCoreAction<'removeNode'> =
  ({ commitTransaction }) =>
  ({ id }) => {
    const { removedNodeIds, removedEdgeIds } = commitTransaction({
      removeNodeIds: [id],
    });

    return { removedNodeIds, removedEdgeIds };
  };
