import { Graph } from '@magic/shared/graph';
import { LensChipDefinition } from '@magic/shared/ui/lens-chips/types';

import { adjacencyListChip } from './chips/adjacencyList.ts';
import { negativeCycleChip } from './chips/negativeCycle.ts';
import { transitionMatrixChip } from './chips/transitionMatrix.ts';

export const lensChips = (graph: Graph): LensChipDefinition[] => [
  negativeCycleChip(graph),
  transitionMatrixChip(),
  adjacencyListChip(),
];
