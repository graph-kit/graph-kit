import AdjacencyList from '@magic/shared/AdjacencyList';
import { LensChipDefinition } from '@magic/shared/ui/lens-chips/types';

export const adjacencyListChip = (): LensChipDefinition => {
  return {
    name: 'Adjacency List',
    tooltipLabel:
      'The neighbors each node points to, as a list. This is what a search reads to work out where it can go next.',

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
