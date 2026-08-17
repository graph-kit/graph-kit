import { Graph } from '@magic/shared/graph';
import { LensChipDefinition } from '@magic/shared/ui/lens-chips/types';

import TransitionMatrix from '../TransitionMatrix.vue';

export const transitionMatrixChip = (graph: Graph): LensChipDefinition => {
  return {
    title: () => 'Transition Matrix',
    tooltipLabel: () => 'Transition Matrix',

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
