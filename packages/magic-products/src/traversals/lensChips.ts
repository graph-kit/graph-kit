import { Graph } from '@magic/shared/graph';
import { LensChipDefinition } from '@magic/shared/ui/lens-chips/types';

import { connectedChip } from './chips/connected.ts';
import { cyclesChip } from './chips/cycles.ts';

export const lensChips = (graph: Graph): LensChipDefinition[] => [
  connectedChip(graph),
  cyclesChip(graph),
];
