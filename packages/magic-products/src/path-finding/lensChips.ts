import { LensChipDefinition } from '@magic/shared/ui/lens-chips/types';

import { adjacencyListChip } from './chips/adjacencyList.ts';
import { transitionMatrixChip } from './chips/transitionMatrix.ts';

export const lensChips = (): LensChipDefinition[] => [
  transitionMatrixChip(),
  adjacencyListChip(),
];
