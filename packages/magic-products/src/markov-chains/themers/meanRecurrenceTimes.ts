import { CoreNode } from '@graph/primitives/types';
import { GNode, Graph } from '@magic/shared/graph';
import { Themer } from '@magic/shared/theme';
import Fraction from 'fraction.js';

import { ComputedRef } from 'vue';

const NEVER_RETURNS = '∞';

/** labels every state with how many steps the chain takes to come back to it */
export const meanRecurrenceTimesThemer = (
  graph: Graph,
  meanRecurrenceTimes: ComputedRef<
    Map<GNode['id'], Fraction | undefined> | undefined
  >,
): Themer => {
  const timeText = ({ id }: CoreNode) => {
    const times = meanRecurrenceTimes.value;
    if (!times?.has(id)) return;
    return times.get(id)?.toFraction() ?? NEVER_RETURNS;
  };

  return graph.theme.createThemer({
    surface: {
      'node.default.text.content': timeText,
      'node.hover.text.content': timeText,
    },
  });
};
