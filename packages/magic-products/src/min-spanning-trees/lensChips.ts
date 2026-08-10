import type { Graph } from '@magic/shared/graph';
import { LensChipDefinition } from '@magic/shared/ui/lens-chips/types';

import { allMstsChip } from './chips/allMsts.ts';
import { connectedChip } from './chips/connected.ts';
import { edgeFrequencyChip } from './chips/edgeFrequency.ts';
import { totalCostChip } from './chips/totalCost.ts';

export const lensChips = (graph: Graph): LensChipDefinition[] => [
  allMstsChip(graph),
  totalCostChip(graph),
  connectedChip(graph),
  edgeFrequencyChip(graph),
];
