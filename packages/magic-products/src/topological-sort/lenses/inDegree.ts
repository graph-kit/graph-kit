import { nullThrows } from '@core/utils/assert';
import { Graph } from '@magic/shared/graph';
import { LensChipDefinition } from '@magic/shared/ui/lens-chips/types';

import { createInDegreeLabelThemer } from '../createInDegreeLabelThemer.ts';
import { useInDegrees } from '../useInDegrees.ts';

export const inDegreeChip = (graph: Graph): LensChipDefinition => {
  const inDegrees = useInDegrees(graph);

  const themer = createInDegreeLabelThemer(graph, (id) =>
    nullThrows(inDegrees.value.get(id), 'node has no in-degree'),
  );

  return {
    label: 'In-Degree',
    tooltipLabel: 'How many edges point into each node.',
    lens: {
      id: 'in-degree',
      ...themer,
    },
  };
};
