import colors, { Color } from '@core/utils/colors';
import { CoreNode } from '@graph/primitives/types';
import { GNode, Graph } from '@magic/shared/graph';
import { Themer, createNodeThemer } from '@magic/shared/theme';

import { ComputedRef } from 'vue';

import { useClassIndex } from './classIndex.ts';

const CLASS_COLORS: Color[] = [
  colors.EMERALD_500,
  colors.SKY_500,
  colors.VIOLET_500,
  colors.ORANGE_500,
  colors.PINK_500,
];

/** paints each recurrent class its own color, leaving transient states unpainted */
export const recurrentClassesThemer = (
  graph: Graph,
  recurrentClasses: ComputedRef<Set<GNode['id']>[]>,
): Themer => {
  const classOf = useClassIndex(recurrentClasses);

  const classColor = ({ id }: CoreNode) => {
    const index = classOf.value.get(id);
    if (index === undefined) return;
    return CLASS_COLORS[index % CLASS_COLORS.length];
  };

  return createNodeThemer(graph, classColor);
};
