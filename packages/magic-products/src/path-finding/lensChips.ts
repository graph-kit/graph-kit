import { Graph } from '@magic/shared/graph';
import { LensChipDefinition } from '@magic/shared/ui/lens-chips/types';

import { adjacencyListChip } from './chips/adjacencyList.ts';
import { adjacencyMatrixChip } from './chips/adjacencyMatrix.ts';
import { negativeCycleChip } from './chips/negativeCycle.ts';

export const lensChips = (graph: Graph): LensChipDefinition[] => [
  negativeCycleChip(graph),
  adjacencyMatrixChip(),
  adjacencyListChip(),
];
