import { Color } from '@core/utils/colors';
import { createPhantomAwareEdgeRenderFunction } from '@graph/plugins/phantom/createPhantomAwareEdgeRenderFunction';
import { CoreEdge, CoreNode } from '@graph/primitives/types';
import { Graph } from '@magic/shared/graph';
import Fraction from 'fraction.js';
import tinycolor from 'tinycolor2';

import { Ref, onMounted, ref, watch } from 'vue';

import {
  DEFAULT_EXAMPLE,
  ExampleEdge,
  ExampleProductId,
  ProductExample,
  isExampleProductId,
  productExamples,
} from './examples.ts';
import {
  NODE_RADIUS,
  edgeIdOf,
  nodeIdOf,
  resolveColors,
  resolvePositions,
} from './scene.ts';

/** how far back an edge the product's answer passed over is pushed */
const GHOSTED_OPACITY = 0.35;

export type WelcomeScene = {
  /** the product whose example the canvas is showing */
  active: Readonly<Ref<ExampleProductId>>;
  /** the card the pointer is on, whether or not that product has an example */
  hovered: Readonly<Ref<string | undefined>>;
  /**
   * shows a product's example, or clears the lit card when given nothing. the canvas holds
   * whatever it last drew either way, so a product with no example changes nothing
   */
  hover: (productId: string | undefined) => void;
  /** screen pixels the rail takes off the left, so the scene centers in what is left */
  reservedLeftPx: Ref<number>;
};

const weightOf = ({ weight }: ExampleEdge) => new Fraction(weight ?? 1);

export const useWelcomeScene = (graph: Graph): WelcomeScene => {
  const active = ref<ExampleProductId>(DEFAULT_EXAMPLE);
  const hovered = ref<string>();
  const reservedLeftPx = ref(0);

  const paintByNodeId = new Map<string, Color>();

  const paint = ({ id }: CoreNode) => paintByNodeId.get(id) ?? 'transparent';

  const litPaint = (node: CoreNode) =>
    tinycolor(paint(node)).lighten(8).toHexString();

  /** edges the example marked ghosted, by id, rebuilt on every handover */
  const ghostedEdgeIds = new Set<string>();

  // faded against whatever the preset would have painted, so it reads the same in either
  // theme and follows the edge color rather than pinning a gray of its own
  const fade = (edge: CoreEdge, resolveUnderneath: () => Color) => {
    if (!ghostedEdgeIds.has(edge.id)) return;
    return tinycolor(resolveUnderneath())
      .setAlpha(GHOSTED_OPACITY)
      .toHex8String();
  };

  graph.theme
    .createThemer({
      surface: {
        'node.default.border.color': paint,
        'node.default.size': NODE_RADIUS,
        'node.hover.border.color': litPaint,
        'node.hover.size': NODE_RADIUS,
        'edge.default.color': fade,
        'edge.default.text.color': fade,
        'edge.hover.color': fade,
        'edge.hover.text.color': fade,
      },
    })
    .activate();

  /**
   * the canvas graph is directed and weighted no matter which example is up, since
   * directedness is fixed when a graph is built. arrowheads and weight labels are the
   * renderer's call instead, so each example can look like the product it stands for
   */
  const applyEdgeRendering = ({ directed, weighted }: ProductExample) => {
    graph.setRenderFunction(
      'edge',
      createPhantomAwareEdgeRenderFunction(
        {
          surface: graph.surface,
          metadata: { directed, weighted },
          theme: graph.theme,
          phantom: graph.phantom,
          getEdges: graph.getEdges,
        },
        { labelled: weighted },
      ),
    );
  };

  const positionsOf = (example: ProductExample) =>
    resolvePositions(example, graph.surface.visibleWorldRect.value, {
      reservedLeftPx: reservedLeftPx.value,
      zoom: graph.surface.camera.state.zoom.value,
    });

  /** which handover the elements on the canvas belong to */
  let generation = 0;

  let drawn: ProductExample | undefined;

  /** clears the canvas and stands the example up in its place */
  const draw = (example: ProductExample) => {
    generation += 1;

    paintByNodeId.clear();
    for (const { index, color } of resolveColors(example)) {
      paintByNodeId.set(nodeIdOf(generation, index), color);
    }

    ghostedEdgeIds.clear();
    for (const edge of example.edges) {
      if (edge.ghosted) ghostedEdgeIds.add(edgeIdOf(generation, edge));
    }

    applyEdgeRendering(example);

    graph.actions.removeElements({
      nodes: graph.nodes.value.map(({ id }) => ({ id })),
      edges: graph.edges.value.map(({ id }) => ({ id })),
    });

    graph.actions.addElements({
      nodes: positionsOf(example).map(({ index, position }) => ({
        id: nodeIdOf(generation, index),
        label: example.nodes[index].label,
        position,
      })),
      edges: example.edges.map((edge) => ({
        id: edgeIdOf(generation, edge),
        source: nodeIdOf(generation, edge.from),
        target: nodeIdOf(generation, edge.to),
        weight: weightOf(edge),
      })),
    });

    drawn = example;
  };

  const show = (productId: ExampleProductId) => {
    const next = productExamples[productId];
    if (next !== drawn) draw(next);
  };

  const hover: WelcomeScene['hover'] = (productId) => {
    hovered.value = productId;
    if (productId !== undefined && isExampleProductId(productId)) {
      active.value = productId;
    }
  };

  watch(active, show);

  // the rail comes and goes with the window width, and the scene is centered on the canvas
  // it leaves uncovered, so a change in what it takes re-places whatever is drawn
  watch(reservedLeftPx, () => {
    if (!drawn) return;
    graph.positions.setMany(
      positionsOf(drawn).map(({ index, position }) => ({
        nodeId: nodeIdOf(generation, index),
        update: position,
      })),
    );
  });

  onMounted(() => show(active.value));

  return { active, hovered, hover, reservedLeftPx };
};
