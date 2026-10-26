import { CoreNode } from '@graph/primitives/types';
import { Graph } from '@magic/shared/graph';
import { LensChipDefinition } from '@magic/shared/ui/lens-chips/types';

import { useInDegrees } from '../useInDegrees.ts';

export const inDegreeChip = (graph: Graph): LensChipDefinition => {
  const inDegrees = useInDegrees(graph);

  const inDegreeText = ({ id }: CoreNode) =>
    inDegrees.value.get(id)?.toString();

  const themer = graph.theme.createThemer({
    surface: {
      'node.default.text.content': inDegreeText,
      'node.hover.text.content': inDegreeText,
    },
  });

  return {
    label: 'In-Degree',
    tooltipLabel:
      "How many edges point into each node. Kahn's algorithm places a node once every edge into it has been removed.",
    lens: {
      id: 'in-degree',
      ...themer,
    },
  };
};
