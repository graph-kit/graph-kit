import { createAnimatedShapes } from '@canvas/primitives/animation/index';
import { crossPattern } from '@canvas/surface/crossPattern';
import { CanvasSurface } from '@canvas/surface/types';
import { createThemeController } from '@core/themes/index';
import { KeyboardEventEntries } from '@core/utils/types';
import { createGraphEventHub } from '@graph/primitives/events';
import { CoreEdge } from '@graph/primitives/types';

import { createAggregator } from './aggregator/createAggregator.ts';
import { CanvasElement } from './aggregator/types.ts';
import { CANVAS_PLUGIN_ID } from './constants.ts';
import { emitKeyboardEvents, emitMouseEvents } from './emitDOMEvents.ts';
import { CanvasGraphMouseEvent, createCanvasEventRegistry } from './events.ts';
import { createNodeCanvasElementPriorityGetter } from './nodeCanvasElementPriority.ts';
import { createNodePaintOrder } from './nodePaintOrder.ts';
import { setupCanvasCursor } from './setupCanvasCursor.ts';
import { setupOnHoveredElementChangeEvent } from './setupHoveredElement.ts';
import { createCanvasDetectors, createCanvasThemeOverrides } from './themes.ts';
import { CanvasPlugin, GraphUnderCursor } from './types.ts';

const sameElements = (previous: CanvasElement[], next: CanvasElement[]) => {
  if (previous.length !== next.length) return false;
  for (let i = 0; i < previous.length; i++) {
    if (previous[i].id !== next[i].id) return false;
  }
  return true;
};

export const canvas =
  (surface: CanvasSurface): CanvasPlugin =>
  ({ controls, getters }) => {
    const canvasEventRegistry = createCanvasEventRegistry();
    const canvasEvents = createGraphEventHub(canvasEventRegistry);

    const { shapes, ...renderer } = createAnimatedShapes();
    const aggregator = createAggregator(canvasEvents, renderer);

    const graphUnderCursor: GraphUnderCursor = {
      coords: { x: 0, y: 0 },
      elements: [],
      get topElement() {
        return this.elements.at(-1);
      },
    };

    // too many things move the canvas on their own to invalidate a cache
    // reliably, so this recomputes each frame and emits only on a real change
    const refreshGraphUnderCursor = () => {
      const coords = surface.cursorCoordinates.value;
      const elements = aggregator.getCanvasElementsAtCoordinate(coords);

      const changed =
        coords.x !== graphUnderCursor.coords.x ||
        coords.y !== graphUnderCursor.coords.y ||
        !sameElements(graphUnderCursor.elements, elements);

      graphUnderCursor.coords = coords;
      graphUnderCursor.elements = elements;

      if (!changed) return;
      canvasEvents.emit('onGraphUnderCursorChange', graphUnderCursor);
    };

    // ahead of setupCanvasCursor so the cursor it paints reflects this frame's hit test
    canvasEvents.subscribe('onDraw', refreshGraphUnderCursor);

    const theme = createThemeController(createCanvasThemeOverrides());

    setupCanvasCursor({
      canvas: surface.canvas,
      getNode: getters.getNode,
      subscribe: canvasEvents.subscribe,
      resolveToken: theme._resolveToken,
      graphUnderCursor,
    });

    setupOnHoveredElementChangeEvent(canvasEvents);

    // local to this client, and never a position: a hover decides what this user sees in
    // front, not where the node is
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

    // graphUnderCursor can lag a press (camera moved, or no draw since), so the
    // hit test is redone against the point the native event carries
    const graphMouseEvent = (event: MouseEvent): CanvasGraphMouseEvent => {
      const coords = surface.toWorldCoordinates(event);
      const elements = aggregator.getCanvasElementsAtCoordinate(coords);

      return {
        coords,
        elements,
        topElement: elements.at(-1),
        event,
      };
    };

    emitMouseEvents(surface.events, graphMouseEvent, canvasEvents.emit);

    const keyboardEvents = emitKeyboardEvents(canvasEvents.emit);

    surface.lifecycleEvents.subscribe('onMounted', () => {
      for (const [event, listeners] of Object.entries(
        keyboardEvents,
      ) as KeyboardEventEntries) {
        document.addEventListener(event, listeners);
      }
    });

    surface.lifecycleEvents.subscribe('onBeforeUnmount', () => {
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

        graphUnderCursor,

        getNodePriority: () => getNodePriority,

        theme: {
          ...theme,
          detectors: createCanvasDetectors(
            theme._resolveToken,
            graphUnderCursor,
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
