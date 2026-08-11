import { CoreGetters } from '@graph/core/getters';
import { CoreControls } from '@graph/core/types';
import { GraphPlugin } from '@graph/plugins-shared/plugins';
import { GraphGetters } from '@graph/primitives/getters/types';

/**
 * a 2D array (matrix) where matrix[i][j] represents the weight of
 * transitioning from node i to node j
 */
export type TransitionMatrix = CoreGetters['getEdge']['weight'][][];

/** the slice of the graph the matrix is built from */
export type TransitionMatrixGraph = Pick<
  CoreControls,
  'metadata' | 'nodes' | 'edges'
> &
  Pick<GraphGetters<CoreGetters>, 'getEdge'>;

export type TransitionMatrixControls = () => TransitionMatrix;

export type TransitionMatrixPlugin = GraphPlugin<{
  name: 'transitionMatrix';
  controls: TransitionMatrixControls;
}>;
