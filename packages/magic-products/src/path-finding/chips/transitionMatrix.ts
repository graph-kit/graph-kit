import { Graph } from '@magic/shared/graph';
import { LensChipDefinition } from '@magic/shared/ui/lens-chips/types';

import TransitionMatrix from '../TransitionMatrix.vue';

export const transitionMatrixChip = (graph: Graph): LensChipDefinition => {
  return {
    name: () => 'Transition Matrix',
    tooltipLabel: () =>
      'The weight of the edge from each row node to each column node, laid out as a grid.',

    lens: {
      id: 'transition-matrix',
      components: [
        {
          component: TransitionMatrix,
          position: 'center-right',
        },
      ],
      activate: () => null,
      deactivate: () => null,
    },
  };
};
