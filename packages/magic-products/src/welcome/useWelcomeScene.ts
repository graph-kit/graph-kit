import { nullThrows } from '@core/utils/assert';
import { Color } from '@core/utils/colors';
import { CoreNode } from '@graph/primitives/types';
import { Graph } from '@magic/shared/graph';
import { manifests } from '@magic/shared/product';
import tinycolor from 'tinycolor2';

import { onMounted } from 'vue';

import {
  NODE_RADIUS,
  edgeIdOf,
  nodeIdOf,
  pickArrangement,
  resolveColors,
  resolvePositions,
} from './scene.ts';

const SEED_DURATION_MS = 300;

export const useWelcomeScene = (graph: Graph) => {
  const arrangement = pickArrangement();

  const paintByNodeId = new Map<string, Color>();

  for (const { productId, color } of resolveColors(arrangement)) {
    paintByNodeId.set(nodeIdOf(productId), color);
  }

  const paint = ({ id }: CoreNode) =>
    nullThrows(paintByNodeId.get(id), 'node is not a welcome node');

  const litPaint = (node: CoreNode) =>
    tinycolor(paint(node)).lighten(8).toHexString();

  graph.theme
    .createThemer({
      surface: {
        'node.default.border.color': paint,
        'node.default.size': NODE_RADIUS,
        'node.hover.border.color': litPaint,
        'node.hover.size': NODE_RADIUS,
      },
      focus: {
        'node.focus.size': NODE_RADIUS,
      },
    })
    .activate();

  const seed = () =>
    graph.animation.capture(
      () =>
        graph.actions.addElements({
          nodes: resolvePositions(
            arrangement,
            graph.surface.visibleWorldRect.value,
          ).map(({ productId, position }) => ({
            id: nodeIdOf(productId),
            label: manifests[productId].abbreviatedName,
            position,
          })),
          edges: arrangement.edges.map(([source, target], index) => ({
            id: edgeIdOf(index),
            source: nodeIdOf(source),
            target: nodeIdOf(target),
          })),
        }),
      { durationMs: SEED_DURATION_MS },
    );

  onMounted(seed);
};
