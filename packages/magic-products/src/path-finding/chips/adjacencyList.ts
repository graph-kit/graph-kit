import { LensChipDefinition } from '@magic/shared/ui/lens-chips/types';

import AdjacencyList from '../AdjacencyList.vue';

export const adjacencyListChip = (): LensChipDefinition => {
  return {
    name: 'Adjacency List',
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
