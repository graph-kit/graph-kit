import { CoreNode } from '@graph/primitives/types';
import { GNode, Graph } from '@magic/shared/graph';
import { Themer } from '@magic/shared/theme';

import { ComputedRef } from 'vue';

import { useClassIndex } from './classIndex.ts';

/** labels every recurrent state with the period of the class it belongs to */
export const periodicityThemer = (
  graph: Graph,
  recurrentClasses: ComputedRef<Set<GNode['id']>[]>,
  recurrentClassPeriods: ComputedRef<number[]>,
): Themer => {
  const classOf = useClassIndex(recurrentClasses);

  const periodText = ({ id }: CoreNode) => {
    const index = classOf.value.get(id);
    if (index === undefined) return;
    return recurrentClassPeriods.value[index].toString();
  };

  return graph.theme.createThemer({
    surface: {
      'node.default.text.content': periodText,
    },
  });
};
