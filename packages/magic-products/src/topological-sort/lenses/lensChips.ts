import { Graph } from '@magic/shared/graph';
import {
  LensChipDefinition,
  disabledState,
} from '@magic/shared/ui/lens-chips/types';

import { acyclicChip } from './acyclic.ts';
import { adjacencyListChip } from './adjacencyList.ts';
import { inDegreeChip } from './inDegree.ts';
import { sourcesChip } from './sources.ts';

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
  [
    acyclicChip(graph),
    sourcesChip(graph),
    inDegreeChip(graph),
    adjacencyListChip(),
  ].map(requiresNodes(graph));
