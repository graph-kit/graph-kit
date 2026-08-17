import type { Graph } from '@magic/shared/graph';
import { LensChipDefinition } from '@magic/shared/ui/lens-chips/types';

import { transitionMatrixChip } from './chips/transitionMatrix.ts';

export const lensChips = (graph: Graph): LensChipDefinition[] => [
  transitionMatrixChip(graph),
];
