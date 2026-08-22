import { crossPattern } from '@canvas/surface/crossPattern';
import { useCanvasSurface } from '@canvas/surface/index';
import { createThemeController } from '@core/themes/index';
import { CoreEdge } from '@graph/primitives/types';

import { SURFACE_PLUGIN_ID } from './constants.ts';
import { createNodeCanvasElementPriorityGetter } from './nodeCanvasElementPriority.ts';
import { createNodePaintOrder } from './nodePaintOrder.ts';
import { setupCursor } from './setupCursor.ts';
import {
  createSurfaceDetectors,
  createSurfaceThemeOverrides,
} from './themes.ts';
import { SurfacePlugin } from './types.ts';

export const surface: SurfacePlugin = ({ controls, getters }) => {
  const canvasSurface = useCanvasSurface();
  const { aggregator } = canvasSurface;

  const theme = createThemeController(createSurfaceThemeOverrides());

  setupCursor({
    canvas: canvasSurface.canvas,
    getNode: getters.getNode,
    subscribe: aggregator.events.subscribe,
    resolveToken: theme._resolveToken,
    elementsUnderCursor: canvasSurface.elementsUnderCursor,
  });

  const paintOrder = createNodePaintOrder();

  canvasSurface.events.elements.handle(
    'onHoveredElementChange',
    (hoveredEl) => {
      if (!hoveredEl) return;
      const { id } = hoveredEl;
      if (controls.isNode(id)) paintOrder.promote(id);
    },
    SURFACE_PLUGIN_ID,
  );

  canvasSurface.draw.backgroundPattern.value = crossPattern((alpha) =>
    theme._resolveToken('canvas.patternColor', alpha),
  );

  aggregator.events.subscribe('onDraw', () => {
    const canvas = canvasSurface.canvas.value;
    if (!canvas) return;
    canvas.style.backgroundColor = theme._resolveToken('canvas.color');
  });

  let getNodePriority = createNodeCanvasElementPriorityGetter({
    nodes: controls.nodes,
    paintOrder,
  });
  aggregator.events.subscribe('onBeforeDraw', () => {
    getNodePriority = createNodeCanvasElementPriorityGetter({
      nodes: controls.nodes,
      paintOrder,
    });
  });

  return {
    name: 'surface',
    controls: {
      ...canvasSurface,

      getNodePriority: () => getNodePriority,

      theme: {
        ...theme,
        detectors: createSurfaceDetectors(
          theme._resolveToken,
          canvasSurface.elementsUnderCursor,
        ),
      },
    },
    transit: {
      encode: () => {
        const camera = canvasSurface.camera.state;
        return {
          panX: camera.panX.value,
          panY: camera.panY.value,
          zoom: camera.zoom.value,
        };
      },
      decode: (data) => {
        const camera = canvasSurface.camera.state;
        camera.panX.value = data.panX;
        camera.panY.value = data.panY;
        camera.zoom.value = data.zoom;
      },
      validate: (_data) => true,
    },
    onAfterInit: () => {
      const weightLayer = theme.createLayer(SURFACE_PLUGIN_ID + '/edge-weight');
      const weight = (edge: CoreEdge) => {
        if (!controls.isEdge(edge.id)) return;
        return getters.getEdge(edge.id).weight.toFraction();
      };
      weightLayer.set('edge.default.text.content', weight);
      weightLayer.set('edge.hover.text.content', weight);
    },
  };
};
