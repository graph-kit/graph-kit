import { LensChipDefinition } from '@magic/shared/ui/lens-chips/types';

import AdjacencyMatrix from '../AdjacencyMatrix.vue';

export const adjacencyMatrixChip = (): LensChipDefinition => {
  return {
    name: 'Adjacency Matrix',
    tooltipLabel:
      'The weight of the edge from each row node to each column node.',

    lens: {
      id: 'adjacency-matrix',
      components: [
        {
          component: AdjacencyMatrix,
          position: 'center-right',
        },
      ],
    },
  };
};
