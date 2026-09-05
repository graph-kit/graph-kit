import AdjacencyMatrix from '@magic/shared/AdjacencyMatrix';
import { LensChipDefinition } from '@magic/shared/ui/lens-chips/types';

export const adjacencyMatrixChip = (): LensChipDefinition => {
  return {
    label: 'Adjacency Matrix',
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
