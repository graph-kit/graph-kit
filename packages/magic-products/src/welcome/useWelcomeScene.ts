import { nullThrows } from '@core/utils/assert';
import { Color } from '@core/utils/colors';
import { CoreNode } from '@graph/primitives/types';
import { Graph } from '@magic/shared/graph';
import { ProductManifest, manifests } from '@magic/shared/product';
import { useFocusedNode } from '@magic/shared/utilities';
import tinycolor from 'tinycolor2';

import { computed, inject, onMounted, onUnmounted, provide, ref } from 'vue';

import {
  NODE_RADIUS,
  edgeIdOf,
  nodeIdOf,
  pickArrangement,
  resolveColors,
  resolvePositions,
} from './scene.ts';

const SEED_DURATION_MS = 300;

const KEY = 'WELCOME_SCENE';

const createWelcomeScene = (graph: Graph) => {
  const arrangement = pickArrangement();

  const productByNodeId = new Map<string, ProductManifest>();
  const paintByNodeId = new Map<string, Color>();

  for (const { productId, color } of resolveColors(arrangement)) {
    productByNodeId.set(nodeIdOf(productId), manifests[productId]);
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

  const hoveredProduct = ref<ProductManifest>();

  const focusedNode = useFocusedNode(graph);

  const focusedProduct = computed(() => {
    if (!focusedNode.value) return;
    return nullThrows(
      productByNodeId.get(focusedNode.value.id),
      'node is not a welcome node',
    );
  });

  /** pointing at a product previews it, clicking one pins it */
  const activeProduct = computed(
    () => hoveredProduct.value ?? focusedProduct.value,
  );

  // edges are hoverable too, and those are the only elements without a product
  const trackHover = (element: { id: string } | undefined) => {
    hoveredProduct.value = element
      ? productByNodeId.get(element.id)
      : undefined;
  };

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

  onMounted(() => {
    seed();
    graph.surface.events.elements.subscribe(
      'onHoveredElementChange',
      trackHover,
    );
  });

  onUnmounted(() => {
    graph.surface.events.elements.unsubscribe(
      'onHoveredElementChange',
      trackHover,
    );
  });

  return { activeProduct };
};

export type WelcomeScene = ReturnType<typeof createWelcomeScene>;

export const provideWelcomeScene = (graph: Graph) => {
  const scene = createWelcomeScene(graph);
  provide(KEY, scene);
  return scene;
};

export const useWelcomeScene = () =>
  nullThrows(inject<WelcomeScene>(KEY), 'welcome scene not provided!');
