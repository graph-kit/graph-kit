import { nullThrows } from '@core/utils/assert';
import { Color } from '@core/utils/colors';
import { createPhantomAwareEdgeRenderFunction } from '@graph/plugins/phantom/createPhantomAwareEdgeRenderFunction';
import { CoreEdge, CoreNode } from '@graph/primitives/types';
import { Graph } from '@magic/shared/graph';
import Fraction from 'fraction.js';
import tinycolor from 'tinycolor2';

import { Ref, inject, onMounted, provide, ref, watch } from 'vue';

import {
  DEFAULT_EXAMPLE,
  ExampleEdge,
  ExampleProductId,
  GraphExample,
  ProductExample,
  SetsExample,
  productExamples,
} from './examples.ts';
import {
  NODE_RADIUS,
  PlacementPoint,
  edgeIdOf,
  nodeIdOf,
  resolvePositions,
  wipeColorsByNode,
} from './scene.ts';
import { createSetsRenderer } from './setsRenderer.ts';

const GHOSTED_OPACITY = 0.35;

export type WelcomeScene = {
  /** the product whose example is on the canvas */
  showing: Readonly<Ref<ExampleProductId>>;
  show: (productId: ExampleProductId) => void;
  /** screen pixels the rail takes off the left, so the scene centers in what is left */
  reservedLeftPx: Ref<number>;
};

const weightOf = ({ weight }: ExampleEdge) => new Fraction(weight ?? 1);

export const useWelcomeScene = (graph: Graph): WelcomeScene => {
  const showing = ref<ExampleProductId>(DEFAULT_EXAMPLE);
  const reservedLeftPx = ref(0);

  const nodeColors = new Map<string, Color>();
  const ghostedEdges = new Set<string>();

  const paint = ({ id }: CoreNode) => nodeColors.get(id) ?? 'transparent';

  const litPaint = (node: CoreNode) =>
    tinycolor(paint(node)).lighten(8).toHexString();

  // faded against what the preset would have painted, so it follows the theme
  const fade = (edge: CoreEdge, resolveUnderneath: () => Color) =>
    ghostedEdges.has(edge.id)
      ? tinycolor(resolveUnderneath()).setAlpha(GHOSTED_OPACITY).toHex8String()
      : undefined;

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

  // directedness is fixed when a graph is built, so which examples show arrowheads and
  // weights is the renderer's call rather than the graph's
  const applyEdgeRendering = ({ directed, weighted }: GraphExample) =>
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

  const place = (points: readonly PlacementPoint[]) =>
    resolvePositions(points, graph.surface.visibleWorldRect.value, {
      reservedLeftPx: reservedLeftPx.value,
      zoom: graph.surface.camera.state.zoom.value,
    });

  const nodePoints = ({ nodes }: GraphExample): PlacementPoint[] =>
    nodes.map(({ at }) => ({ at, reach: NODE_RADIUS }));

  const setPoints = ({ sets }: SetsExample): PlacementPoint[] =>
    sets.map(({ at, radius }) => ({ at, reach: radius }));

  const sets = createSetsRenderer(graph);

  let generation = 0;

  const drawGraph = (example: GraphExample) => {
    wipeColorsByNode(example.nodes).forEach((color, index) =>
      nodeColors.set(nodeIdOf(generation, index), color),
    );

    for (const edge of example.edges) {
      if (edge.ghosted) ghostedEdges.add(edgeIdOf(generation, edge));
    }

    applyEdgeRendering(example);

    graph.actions.addElements({
      nodes: place(nodePoints(example)).map((position, index) => ({
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
  };

  const draw = (example: ProductExample) => {
    generation += 1;
    nodeColors.clear();
    ghostedEdges.clear();
    sets.clear();
    graph.actions.removeElements({
      nodes: graph.nodes.value.map(({ id }) => ({ id })),
      edges: graph.edges.value.map(({ id }) => ({ id })),
    });

    if (example.kind === 'sets') {
      sets.show({ example, centers: place(setPoints(example)) });
    } else {
      drawGraph(example);
    }
  };

  const redraw = () => draw(productExamples[showing.value]);

  watch([showing, reservedLeftPx], redraw);
  onMounted(redraw);

  return {
    showing,
    show: (productId) => {
      showing.value = productId;
    },
    reservedLeftPx,
  };
};

const SCENE_KEY = 'welcome-scene';

export const provideWelcomeScene = (scene: WelcomeScene) =>
  provide(SCENE_KEY, scene);

export const useProvidedWelcomeScene = () =>
  nullThrows(inject<WelcomeScene>(SCENE_KEY), 'welcome scene not provided');
