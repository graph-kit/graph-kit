import { createAnimatedShapes } from '@canvas/primitives/animation/index';
import { crossPattern } from '@canvas/surface/crossPattern';
import { CanvasProps } from '@canvas/surface/types';
import { createThemeController } from '@core/themes/index';
import { getWorldCoordinates, getCtx } from '@core/utils/canvas/index';
import { KeyboardEventEntries, MouseEventEntries } from '@core/utils/types';
import { createEventHub } from '@graph/primitives/events/createEventHub';
import { CoreEdge } from '@graph/primitives/types';

import { createAggregator } from './aggregator/createAggregator.ts';
import { CanvasElement } from './aggregator/types.ts';
import { CANVAS_PLUGIN_ID } from './constants.ts';
import { emitKeyboardEvents, emitMouseEvents } from './emitDOMEvents.ts';
import { CanvasGraphMouseEvent, createCanvasEventRegistry } from './events.ts';
import { createNodeCanvasElementPriorityGetter } from './nodeCanvasElementPriority.ts';
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
  (surface: CanvasProps): CanvasPlugin =>
  ({ controls, getters }) => {
    const canvasEventRegistry = createCanvasEventRegistry();
    const canvasEvents = createEventHub(canvasEventRegistry);

    const { shapes, ...renderer } = createAnimatedShapes();
    const aggregator = createAggregator(canvasEvents, renderer);

    const graphUnderCursor: GraphUnderCursor = {
      coords: { x: 0, y: 0 },
      elements: [],
      get topElement() {
        return this.elements.at(-1);
      },
    };

    /*
      what sits under the cursor is a function of the cursor position and everything drawn
      on the canvas, and the canvas moves on its own: animations interpolating, a peer
      dragging a node, a simulation stepping. enumerating those causes so each one can
      invalidate a cache is a losing game, and every plugin that pushes to the aggregator
      is one more chance to forget. so this recomputes off the aggregator that draw just
      rebuilt, every frame, and only emits when the answer actually changed
    */
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

    // went with max+1 instead of closed rotation for node hovers since rotation requires
    // redistributing z values across all nodes, which breaks when new nodes arrive with a default z that
    // collides with the existing distribution. max+1 gives permanent promotion
    // without touching other nodes and works fine since node z-scored get normalized for rendering anyway.
    const setHoveredNode = (nodeId: string) => {
      const maxZ = controls
        .nodes()
        .reduce(
          (max, n) => Math.max(max, controls.positions.get(n.id).z),
          -Infinity,
        );
      controls.positions.set({ nodeId, update: { z: maxZ + 1 } });
    };

    canvasEvents.handle(
      'onHoveredElementChange',
      (hoveredEl) => {
        if (!hoveredEl) return;
        const { id } = hoveredEl;
        if (controls.isNode(id)) setHoveredNode(id);
      },
      CANVAS_PLUGIN_ID,
    );

    /*
      graphUnderCursor is captured on mousemove and refreshed once a frame, so a
      press can carry a point the cursor has already left: right after a camera
      move the cursor never moved through, or before the next draw lands. the
      native event knows where it happened, so the hit test is redone against it
    */
    const graphMouseEvent = (event: MouseEvent): CanvasGraphMouseEvent => {
      const { x, y } = getWorldCoordinates(event, getCtx(surface.canvas));
      const coords = { x, y };
      const elements = aggregator.getCanvasElementsAtCoordinate(coords);

      return {
        coords,
        elements,
        topElement: elements.at(-1),
        event,
      };
    };

    const mouseEvents = emitMouseEvents(graphMouseEvent, canvasEvents.emit);

    const keyboardEvents = emitKeyboardEvents(canvasEvents.emit);

    surface.lifecycleEvents.subscribe('onMounted', () => {
      if (!surface.canvas.value) {
        throw new Error('Canvas element not found in DOM');
      }

      for (const [event, listeners] of Object.entries(
        mouseEvents,
      ) as MouseEventEntries) {
        surface.canvas.value.addEventListener(event, listeners);
      }

      for (const [event, listeners] of Object.entries(
        keyboardEvents,
      ) as KeyboardEventEntries) {
        document.addEventListener(event, listeners);
      }
    });

    surface.lifecycleEvents.subscribe('onBeforeUnmount', () => {
      if (!surface.canvas.value) {
        throw new Error('Canvas element not found in DOM');
      }

      for (const [event, listeners] of Object.entries(
        mouseEvents,
      ) as MouseEventEntries) {
        surface.canvas.value.removeEventListener(event, listeners);
      }

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
      positions: controls.positions,
    });
    canvasEvents.subscribe('onBeforeDraw', () => {
      getNodePriority = createNodeCanvasElementPriorityGetter({
        nodes: controls.nodes,
        positions: controls.positions,
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
