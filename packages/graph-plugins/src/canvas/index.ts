import { crossPattern } from '@canvas/surface/crossPattern';
import { CanvasSurface } from '@canvas/surface/types';
import { createThemeController } from '@core/themes/index';
import { KeyboardEventEntries } from '@core/utils/types';
import { createGraphEventHub } from '@graph/primitives/events';
import { CoreEdge } from '@graph/primitives/types';

import { CANVAS_PLUGIN_ID } from './constants.ts';
import { emitKeyboardEvents, emitMouseEvents } from './emitDOMEvents.ts';
import { createCanvasEventRegistry } from './events.ts';
import { createNodeCanvasElementPriorityGetter } from './nodeCanvasElementPriority.ts';
import { createNodePaintOrder } from './nodePaintOrder.ts';
import { setupCanvasCursor } from './setupCanvasCursor.ts';
import { createCanvasDetectors, createCanvasThemeOverrides } from './themes.ts';
import { CanvasPlugin } from './types.ts';

export const canvas =
  (surface: CanvasSurface): CanvasPlugin =>
  ({ controls, getters }) => {
    const canvasEventRegistry = createCanvasEventRegistry();
    const canvasEvents = createGraphEventHub(canvasEventRegistry);

    const { aggregator, shapes, renderer } = surface;

    aggregator.events.subscribe('onBeforeDraw', (ctx) =>
      canvasEvents.emit('onBeforeDraw', ctx),
    );
    aggregator.events.subscribe('onDraw', (ctx) =>
      canvasEvents.emit('onDraw', ctx),
    );

    surface.events.elements.subscribe('onElementsUnderCursorChange', (data) =>
      canvasEvents.emit('onGraphUnderCursorChange', data),
    );
    surface.events.elements.subscribe(
      'onHoveredElementChange',
      (newElement, oldElement) =>
        canvasEvents.emit('onHoveredElementChange', newElement, oldElement),
    );

    const theme = createThemeController(createCanvasThemeOverrides());

    setupCanvasCursor({
      canvas: surface.canvas,
      getNode: getters.getNode,
      subscribe: canvasEvents.subscribe,
      resolveToken: theme._resolveToken,
      elementsUnderCursor: surface.elementsUnderCursor,
    });

    const paintOrder = createNodePaintOrder();

    canvasEvents.handle(
      'onHoveredElementChange',
      (hoveredEl) => {
        if (!hoveredEl) return;
        const { id } = hoveredEl;
        if (controls.isNode(id)) paintOrder.promote(id);
      },
      CANVAS_PLUGIN_ID,
    );

    emitMouseEvents(surface.events.elements, canvasEvents.emit);

    const keyboardEvents = emitKeyboardEvents(canvasEvents.emit);

    surface.events.lifecycle.subscribe('onMounted', () => {
      for (const [event, listeners] of Object.entries(
        keyboardEvents,
      ) as KeyboardEventEntries) {
        document.addEventListener(event, listeners);
      }
    });

    surface.events.lifecycle.subscribe('onBeforeUnmount', () => {
      for (const [event, listeners] of Object.entries(
        keyboardEvents,
      ) as KeyboardEventEntries) {
        document.removeEventListener(event, listeners);
      }
    });

    surface.draw.backgroundPattern.value = crossPattern((alpha) =>
      theme._resolveToken('canvas.patternColor', alpha),
    );

    canvasEvents.subscribe('onDraw', () => {
      const canvas = surface.canvas.value;
      if (!canvas) return;
      canvas.style.backgroundColor = theme._resolveToken('canvas.color');
    });

    let getNodePriority = createNodeCanvasElementPriorityGetter({
      nodes: controls.nodes,
      paintOrder,
    });
    canvasEvents.subscribe('onBeforeDraw', () => {
      getNodePriority = createNodeCanvasElementPriorityGetter({
        nodes: controls.nodes,
        paintOrder,
      });
    });

    return {
      name: 'canvas',
      controls: {
        aggregator,
        shapes,
        renderer,
        events: canvasEvents,

        surface,

        getNodePriority: () => getNodePriority,

        theme: {
          ...theme,
          detectors: createCanvasDetectors(
            theme._resolveToken,
            surface.elementsUnderCursor,
          ),
        },
      },
      transit: {
        encode: () => {
          const camera = surface.camera.state;
          return {
            panX: camera.panX.value,
            panY: camera.panY.value,
            zoom: camera.zoom.value,
          };
        },
        decode: (data) => {
          const camera = surface.camera.state;
          camera.panX.value = data.panX;
          camera.panY.value = data.panY;
          camera.zoom.value = data.zoom;
        },
        validate: (data) => true,
      },
      onAfterInit: () => {
        const weightLayer = theme.createLayer(
          CANVAS_PLUGIN_ID + '/edge-weight',
        );
        const weight = (edge: CoreEdge) => {
          if (!controls.isEdge(edge.id)) return;
          return getters.getEdge(edge.id).weight.toFraction();
        };
        weightLayer.set('edge.default.text.content', weight);
        weightLayer.set('edge.hover.text.content', weight);
      },
    };
  };
