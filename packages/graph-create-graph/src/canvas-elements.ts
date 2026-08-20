import { CanvasElement } from '@canvas/primitives/aggregator/types';
import { nullThrows } from '@core/utils/assert';
import { ComputedTokenResolver } from '@graph/computed-tokens/index';
import { CoreControls } from '@graph/core/types';
import { CANVAS_ELEMENT_CURSOR_FIELD_KEY } from '@graph/plugins/surface/setupCursor';
import { SurfaceControls } from '@graph/plugins/surface/types';
import { CoreEdge, CoreNode } from '@graph/primitives/types';
import {
  EdgeRenderFunction,
  NodeRenderFunction,
  RenderFunctions,
  createDefaultEdgeRenderOptions,
  createEdgeRenderFunction,
  createNodeRenderFunction,
} from '@graph/render-functions/index';
import { getNeighborPositions } from '@graph/render-functions/utils/getNeighborPositions';

export type GetterRenderFunctions = {
  node: () => NodeRenderFunction;
  edge: () => EdgeRenderFunction;
};

export type CanvasElementFactories = {
  edgeToCanvasElement: (edge: CoreEdge) => CanvasElement;
  nodeToCanvasElement: (node: CoreNode) => CanvasElement;
  renderFunctions: GetterRenderFunctions;
  setRenderFunction: <T extends keyof RenderFunctions>(
    type: T,
    fn: RenderFunctions[T],
  ) => void;
};

export const createCanvasElementFactories = (
  controls: CoreControls & { surface: SurfaceControls },
  tokenResolver: ComputedTokenResolver,
): CanvasElementFactories => {
  const renderFunctionOverrides: Partial<RenderFunctions> = {};

  const defaultNodeRenderFunction = createNodeRenderFunction({
    shapes: controls.surface.shapes,
    resolveToken: tokenResolver,
  });

  const defaultEdgeRenderFunction = createEdgeRenderFunction({
    ...createDefaultEdgeRenderOptions({
      surface: controls.surface,
      metadata: controls.metadata,
      resolveToken: tokenResolver,
    }),
    parallelEdges: (edge) =>
      controls.helpers.nodes.getEdgesBetweenConnectedNodes(
        edge.source.id,
        edge.target.id,
      ),
    neighborPositions: (edge) =>
      getNeighborPositions(edge, controls.edges(), controls.positions.get),
    layout: {
      labelled: controls.metadata.weighted,
    },
  });

  const nodeRenderFunction = () =>
    renderFunctionOverrides.node ?? defaultNodeRenderFunction;

  const edgeRenderFunction = () =>
    renderFunctionOverrides.edge ?? defaultEdgeRenderFunction;

  const nodeToCanvasElement = (node: CoreNode): CanvasElement => ({
    id: node.id,
    shape: nodeRenderFunction()({
      id: node.id,
      position: nullThrows(
        controls.positions.get(node.id),
        `could not resolve position for node with id ${node.id}`,
      ),
    }),
    priority: controls.surface.getNodePriority()(node.id),
    data: {
      [CANVAS_ELEMENT_CURSOR_FIELD_KEY]: tokenResolver('node.cursor', node),
    },
  });

  const EDGE_RENDER_PRIORITY = 1;
  const edgeToCanvasElement = (edge: CoreEdge): CanvasElement => ({
    id: edge.id,
    shape: edgeRenderFunction()({
      id: edge.id,
      source: {
        id: edge.source,
        position: controls.positions.get(edge.source),
      },
      target: {
        id: edge.target,
        position: controls.positions.get(edge.target),
      },
    }),
    priority: EDGE_RENDER_PRIORITY,
    data: {
      [CANVAS_ELEMENT_CURSOR_FIELD_KEY]: tokenResolver('edge.cursor', edge),
    },
  });

  return {
    nodeToCanvasElement,
    edgeToCanvasElement,
    renderFunctions: {
      node: nodeRenderFunction,
      edge: edgeRenderFunction,
    },
    setRenderFunction: (type, fn) => (renderFunctionOverrides[type] = fn),
  };
};
