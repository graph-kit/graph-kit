import { nullThrows } from '@core/utils/assert';

import { CreateCoreAction } from '../../types.ts';

export const createRemoveEdgeHandler: CreateCoreAction<'removeEdge'> =
  ({ commitTransaction }) =>
  ({ id }) => {
    const { removedEdgeIds } = commitTransaction({
      removeEdgeIds: [id],
    });

    return nullThrows(
      removedEdgeIds[0],
      'Failed to remove edge. Transaction rejected.',
    );
  };
