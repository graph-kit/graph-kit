import { Color } from '@core/utils/colors';
import { CoreNode } from '@graph/primitives/types';
import { Graph } from '@magic/shared/graph';
import { Themer } from '@magic/shared/theme';
import tinycolor from 'tinycolor2';

import { Ref } from 'vue';

import { formatDistance } from '../distance.ts';
import { SingleSourceFrame } from './frame.ts';

const TENTATIVE_ALPHA = 0.65;

export const createDistanceThemer = (
  graph: Graph,
  frame: Ref<SingleSourceFrame | undefined>,
): Themer => {
  const showingNodeLabel = (id: CoreNode['id']) =>
    graph.anchors.parentNodeId() === id || graph.focus.isFocused(id);

  const distanceText = ({ id }: CoreNode) => {
    const distances = frame.value?.distances;
    if (!distances || !(id in distances) || showingNodeLabel(id)) return;
    return formatDistance(distances[id]);
  };

  const fadeTentative = ({ id }: CoreNode, resolveUnderneath: () => Color) => {
    const settled = frame.value?.settledNodeIds;
    if (!frame.value || settled?.includes(id)) return;
    if (showingNodeLabel(id)) return;
    return tinycolor(resolveUnderneath())
      .setAlpha(TENTATIVE_ALPHA)
      .toHex8String();
  };

  return graph.theme.createThemer({
    surface: {
      'node.default.text.content': distanceText,
      'node.default.text.color': fadeTentative,
      'node.hover.text.color': fadeTentative,
    },
    focus: {
      'node.focus.text.color': fadeTentative,
    },
  });
};
