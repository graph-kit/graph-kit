import { nullThrows } from '@core/utils/assert';
import colors, { Color } from '@core/utils/colors';
import { CoreNode } from '@graph/primitives/types';
import { Graph } from '@magic/shared/graph';
import { Themer, createNodeThemer } from '@magic/shared/theme';

import { ComputedRef, computed } from 'vue';

import { CommunicatingClass } from '../computations/useCommunicatingClasses.ts';
import { useClassIndex } from './classIndex.ts';

const CLASS_COLORS: Color[] = [
  colors.AMBER_500,
  colors.RED_500,
  colors.BLUE_500,
  colors.GREEN_500,
  colors.PURPLE_500,
];

/** paints each class its own color, so states that reach each other read as a group */
export const communicatingClassesThemer = (
  graph: Graph,
  communicatingClasses: ComputedRef<CommunicatingClass[]>,
): Themer => {
  const classOf = useClassIndex(
    computed(() =>
      communicatingClasses.value.map(
        (communicatingClass) => communicatingClass.states,
      ),
    ),
  );

  const classColor = ({ id }: CoreNode) => {
    const index = nullThrows(
      classOf.value.get(id),
      'state belongs to no communicating class',
    );
    return CLASS_COLORS[index % CLASS_COLORS.length];
  };

  return createNodeThemer(graph, classColor);
};
