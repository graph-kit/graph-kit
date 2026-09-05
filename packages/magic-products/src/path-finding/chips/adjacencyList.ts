import AdjacencyList from '@magic/shared/AdjacencyList';
import { LensChipDefinition } from '@magic/shared/ui/lens-chips/types';

export const adjacencyListChip = (): LensChipDefinition => {
  return {
    label: 'Adjacency List',
    tooltipLabel: 'The nodes each node points to, directly, as a list.',

    lens: {
      id: 'adjacency-list',
      components: [
        {
          component: AdjacencyList,
          position: 'center-right',
        },
      ],
    },
  };
};
