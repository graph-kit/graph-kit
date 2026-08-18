import { nullThrows } from '@core/utils/assert';
import { Color } from '@core/utils/colors';
import { CoreNode } from '@graph/primitives/types';
import { Graph } from '@magic/shared/graph';
import { MagicProductManifest, manifests } from '@magic/shared/product';
import { useFocusedNode } from '@magic/shared/utilities';
import tinycolor from 'tinycolor2';

import { computed, inject, onMounted, onUnmounted, provide, ref } from 'vue';

import {
  NODE_RADIUS,
  WelcomeNode,
  edgeIdOf,
  edges,
  nodeIdOf,
  welcomeNodes,
} from './scene.ts';

/** how long each node waits before popping in, so the ring assembles itself */
const STAGGER_MS = 160;

const KEY = 'WELCOME_SCENE';

const createWelcomeScene = (graph: Graph) => {
  const productByNodeId = new Map<string, MagicProductManifest>();
  const paintByNodeId = new Map<string, Color>();

  for (const { productId, color } of welcomeNodes) {
    productByNodeId.set(nodeIdOf(productId), manifests[productId]);
    paintByNodeId.set(nodeIdOf(productId), color);
  }

  const paint = ({ id }: CoreNode) =>
    nullThrows(paintByNodeId.get(id), 'node is not a welcome node');

  const litPaint = (node: CoreNode) =>
    tinycolor(paint(node)).lighten(8).toHexString();

  graph.theme
    .createThemer({
      canvas: {
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

  const hoveredProduct = ref<MagicProductManifest>();

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

  const timeouts: ReturnType<typeof setTimeout>[] = [];

  const schedule = (task: () => void, delayMs: number) => {
    timeouts.push(setTimeout(task, delayMs));
  };

  const addProductNode = ({ productId, position }: WelcomeNode) =>
    graph.animation.capture(() =>
      graph.actions.addNode({
        id: nodeIdOf(productId),
        label: manifests[productId].abbreviatedName,
        position,
      }),
    );

  const connectProducts = () =>
    graph.animation.capture(() =>
      graph.actions.addElements({
        nodes: [],
        edges: edges.map(([source, target], index) => ({
          id: edgeIdOf(index),
          source: nodeIdOf(source),
          target: nodeIdOf(target),
        })),
      }),
    );

  const seed = () => {
    for (const [index, welcomeNode] of welcomeNodes.entries()) {
      schedule(() => addProductNode(welcomeNode), index * STAGGER_MS);
    }

    schedule(connectProducts, welcomeNodes.length * STAGGER_MS);
  };

  onMounted(() => {
    seed();
    graph.canvas.events.subscribe('onHoveredElementChange', trackHover);
  });

  onUnmounted(() => {
    for (const timeout of timeouts) clearTimeout(timeout);
    graph.canvas.events.unsubscribe('onHoveredElementChange', trackHover);
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
