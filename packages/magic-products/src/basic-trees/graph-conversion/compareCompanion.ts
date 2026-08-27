import { nullThrows } from '@core/utils/assert';

import { CompareFrame } from '../simulations/frames.ts';
import { GraphState } from './treeToGraph.ts';

const COMPANION_X_OFFSET = -100;

export const compareCompanion = (frame: CompareFrame, state: GraphState) => {
  const nodeWeAreAdding = frame.targetNode;
  const nodeWeAreComparing = frame.comparedNode;

  const pos = nullThrows(
    state.nodes.find((n) => n.id === nodeWeAreComparing.id)?.position,
    'comparator node not found',
  );

  state.nodes.push({
    id: nodeWeAreAdding.id,
    label: nodeWeAreAdding.value.toString(),
    position: {
      x: nullThrows(pos?.x, 'compare node missing X') + COMPANION_X_OFFSET,
      y: nullThrows(pos?.y, 'compare node missing Y'),
    },
  });
};
