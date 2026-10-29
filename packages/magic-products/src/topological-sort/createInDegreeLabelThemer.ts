import { CoreNode } from '@graph/primitives/types';
import { GNode, Graph } from '@magic/shared/graph';
import { Themer } from '@magic/shared/theme';

import { showNodeLabel } from './showNodeLabel.ts';

export const createInDegreeLabelThemer = (
  graph: Graph,
  getInDegree: (id: GNode['id']) => number | undefined,
): Themer => {
  const inDegreeText = ({ id }: CoreNode) => {
    if (showNodeLabel(graph, id)) return;
    // callers return undefined to show the node label
    return getInDegree(id)?.toString();
  };

  return graph.theme.createThemer({
    surface: { 'node.default.text.content': inDegreeText },
  });
};
