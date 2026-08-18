import { Graph } from '@magic/shared/graph';
import { LensChipDefinition } from '@magic/shared/ui/lens-chips/types';

import AdjacencyList from '../AdjacencyList.vue';

export const adjacencyListChip = (graph: Graph): LensChipDefinition => {
  return {
    title: () => 'Adjacency List',
    tooltipLabel: () => 'The nodes each node points to, directly, as a list.',

    lens: {
      id: 'adjacency-list',
      components: [
        {
          component: AdjacencyList,
          position: 'center-right',
        },
      ],
      activate: () => null,
      deactivate: () => null,
    },
  };
};
