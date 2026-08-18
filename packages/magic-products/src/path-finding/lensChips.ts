import type { Graph } from '@magic/shared/graph';
import { LensChipDefinition } from '@magic/shared/ui/lens-chips/types';

import { adjacencyListChip } from './chips/adjacencyList.ts';
import { transitionMatrixChip } from './chips/transitionMatrix.ts';

export const lensChips = (graph: Graph): LensChipDefinition[] => [
  transitionMatrixChip(graph),
  adjacencyListChip(graph),
];
