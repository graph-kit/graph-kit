import { Graph } from '@magic/shared/graph';
import {
  LensChipDefinition,
  disabledState,
} from '@magic/shared/ui/lens-chips/types';

import { adjacencyListChip } from './chips/adjacencyList.ts';
import { connectedChip } from './chips/connected.ts';
import { cyclesChip } from './chips/cycles.ts';

const requiresNodes =
  (graph: Graph) =>
  (chip: LensChipDefinition): LensChipDefinition => ({
    ...chip,
    disabled: () =>
      (graph.nodes.value.length === 0 && {
        reason: 'Add a node first',
      }) ||
      disabledState(chip),
  });

export const lensChips = (graph: Graph): LensChipDefinition[] =>
  [connectedChip(graph), cyclesChip(graph), adjacencyListChip()].map(
    requiresNodes(graph),
  );
