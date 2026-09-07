import { getCenterPoint } from '@canvas/primitives/helpers';
import { nullThrows } from '@core/utils/assert';
import { BoundingBox } from '@core/utils/canvas/index';

import { OnboardingGraph } from './types.ts';

/** the graph with its offsets resolved against whatever the canvas is showing */
export const placeOnboardingGraph = (
  { nodes, edges }: OnboardingGraph,
  visibleWorldRect: BoundingBox,
): OnboardingGraph => {
  const center = getCenterPoint(visibleWorldRect);

  return {
    nodes: nodes.map((node) => {
      const { x, y } = nullThrows(
        node.position,
        'onboarding graph node was given no position',
      );

      return {
        ...node,
        position: {
          x: center.x + nullThrows(x, 'onboarding graph node was given no x'),
          y: center.y + nullThrows(y, 'onboarding graph node was given no y'),
        },
      };
    }),
    edges,
  };
};
