import { nullThrows } from '@core/utils/assert';
import { Color } from '@core/utils/colors';
import { CoreNode } from '@graph/primitives/types';
import { Graph } from '@magic/shared/graph';
import { Shell, manifests } from '@magic/shared/product';
import { toast } from '@magic/shared/toast';
import tinycolor from 'tinycolor2';

import { capitalize, onMounted } from 'vue';

import { WelcomeArrangement } from './arrangements.ts';
import {
  NODE_RADIUS,
  edgeIdOf,
  nodeIdOf,
  pickArrangement,
  resolveColors,
  resolvePositions,
} from './scene.ts';

const SEED_DURATION_MS = 300;

const REARRANGE_DURATION_MS = 600;

const EASTER_EGG_TOAST_MS = 5_000;

const articleFor = (word: string) =>
  'aeiou'.includes(word[0].toLowerCase()) ? 'An' : 'A';

export const useWelcomeScene = (graph: Graph, shell: Shell) => {
  let arrangement = pickArrangement();

  const paintByNodeId = new Map<string, Color>();

  const repaint = () => {
    for (const { productId, color } of resolveColors(arrangement)) {
      paintByNodeId.set(nodeIdOf(productId), color);
    }
  };

  repaint();

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

  const edgesOf = (layout: WelcomeArrangement) =>
    layout.edges.map(([source, target], index) => ({
      id: edgeIdOf(layout, index),
      source: nodeIdOf(source),
      target: nodeIdOf(target),
    }));

  const positionsOf = (layout: WelcomeArrangement) =>
    resolvePositions(layout, graph.surface.visibleWorldRect.value);

  const seed = () =>
    graph.animation.capture(
      () =>
        graph.actions.addElements({
          nodes: positionsOf(arrangement).map(({ productId, position }) => ({
            id: nodeIdOf(productId),
            label: manifests[productId].abbreviatedName,
            position,
          })),
          edges: edgesOf(arrangement),
        }),
      { durationMs: SEED_DURATION_MS },
    );

  const rearrange = () => {
    const previous = arrangement;
    arrangement = pickArrangement(previous);
    repaint();

    graph.animation.capture(
      () => {
        graph.actions.removeElements({
          nodes: [],
          edges: edgesOf(previous),
        });
        graph.actions.addElements({
          nodes: [],
          edges: edgesOf(arrangement),
        });
        graph.positions.setMany(
          positionsOf(arrangement).map(({ productId, position }) => ({
            nodeId: nodeIdOf(productId),
            update: position,
          })),
        );
      },
      { durationMs: REARRANGE_DURATION_MS },
    );

    toast.show({
      title: `Is That ${articleFor(arrangement.name)} ${capitalize(arrangement.name)}?`,
      description: 'You hit the super secret space bar!',
      severity: 'magic',
      duration: EASTER_EGG_TOAST_MS,
    });
  };

  shell.shortcuts.add({
    id: 'welcome/rearrange',
    key: 'space',
    callback: rearrange,
  });

  onMounted(seed);
};
