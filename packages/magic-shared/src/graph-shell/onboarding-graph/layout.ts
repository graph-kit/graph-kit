import { getCenterPoint } from '@canvas/primitives/helpers';
import { nullThrows } from '@core/utils/assert';
import { BoundingBox } from '@core/utils/canvas/index';

import { AddGNodeOptions } from '../../graph/types.ts';
import { OnboardingGraphElements } from './types.ts';

const idOf = (node: AddGNodeOptions) =>
  nullThrows(node.id, 'onboarding graph node was given no id');

/** the graph with its offsets resolved against whatever the canvas is showing */
export const placeOnboardingGraph = (
  { nodes, edges }: OnboardingGraphElements,
  visibleWorldRect: BoundingBox,
): OnboardingGraphElements => {
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

/** the graph given the ids it replaces, so existing nodes move instead of recreate */
export const adoptExistingNodes = (
  { nodes, edges }: OnboardingGraphElements,
  existingNodeIds: string[],
): OnboardingGraphElements => {
  const adopted = new Map<string, string>();
  for (const [index, node] of nodes.entries()) {
    const existing = existingNodeIds[index];
    if (existing) adopted.set(idOf(node), existing);
  }

  const resolve = (id: string) => adopted.get(id) ?? id;

  return {
    nodes: nodes.map((node) => ({ ...node, id: resolve(idOf(node)) })),
    edges: edges.map((edge) => ({
      ...edge,
      source: resolve(edge.source),
      target: resolve(edge.target),
    })),
  };
};
