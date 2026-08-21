import { Aggregator } from '@canvas/primitives/aggregator/types';
import type { ElementMouseEvent } from '@canvas/surface/events/index';
import { createAnnotations } from '@core/annotations/index';
import { createThemeController } from '@core/themes/index';
import { MOUSE_BUTTONS } from '@core/utils/mouse';
import { createLifecycle } from '@graph/plugins-shared/lifecycle';
import { DeepReadonly } from 'ts-essentials';

import { GraphUnderCursor } from '../surface/types.ts';
import {
  ANNOTATION_HANDLER_PRIORITY,
  ANNOTATION_PLUGIN_ID,
  ANNOTATION_THEME_LAYER_ID,
} from './constants.ts';
import { createAnnotationsThemeOverrides } from './themes.ts';
import { AnnotationsPlugin } from './types.ts';

/**
 * the graph's implementation of the annotation tools: it owns none of their state, only
 * the wiring between the engine in `@core/annotations` and the canvas it draws over.
 * a product without a graph binds the same engine to its own surface instead.
 */
export const annotations: AnnotationsPlugin = ({ controls }) => {
  const theme = createThemeController(createAnnotationsThemeOverrides());

  const engine = createAnnotations({
    surface: controls.surface,
    eraserOutlineColor: () =>
      theme._resolveToken('annotations.eraser.outline.color'),
  });

  const cursorLayer = controls.surface.theme.createLayer(
    ANNOTATION_THEME_LAYER_ID,
  );

  const beginStroke = (
    { coords, event }: ElementMouseEvent,
    consume: () => void,
  ) => {
    if (event.button !== MOUSE_BUTTONS.left) return;
    consume();
    engine.beginStroke(coords);
  };

  // onGraphUnderCursorChange rather than onMouseMove, which misses the frames where the
  // canvas moves under a cursor that is standing still
  const extendStroke = (
    { coords }: DeepReadonly<GraphUnderCursor>,
    consume: () => void,
  ) => {
    consume();
    engine.extendStroke(coords);
  };

  const endStroke = (_: unknown, consume: () => void) => {
    consume();
    engine.endStroke();
  };

  // while the tools have the pointer, a click is a stroke and nothing else
  const swallowClick = (_: unknown, consume: () => void) => consume();

  // annotations are drawn over the graph, never targeted through it: a committed stroke is
  // not clickable and the tool cursors are not elements the pointer can land on
  const addAnnotationsToAggregator = (aggregator: Aggregator) => {
    for (const element of engine.canvasElements()) {
      aggregator.push({ ...element, paintOnly: true });
    }
    return aggregator;
  };

  controls.surface.aggregator.addTransformer(addAnnotationsToAggregator);

  const captureSnapshot = () => controls.history?.captureSnapshot();

  const activate = () => {
    if (!lifecycle.isEnabled()) return;
    engine.activate();

    cursorLayer.set('canvas.cursor', () => engine.cursor());

    const { elements } = controls.surface.events;
    const priority = ANNOTATION_HANDLER_PRIORITY;
    elements.handle('onMouseDown', beginStroke, ANNOTATION_PLUGIN_ID, priority);
    controls.surface.events.elements.handle(
      'onElementsUnderCursorChange',
      extendStroke,
      ANNOTATION_PLUGIN_ID,
      priority,
    );
    elements.handle('onMouseUp', endStroke, ANNOTATION_PLUGIN_ID, priority);
    elements.handle('onClick', swallowClick, ANNOTATION_PLUGIN_ID, priority);
  };

  const deactivate = () => {
    engine.deactivate();

    cursorLayer.removeAll();

    const { elements } = controls.surface.events;
    elements.unhandle('onMouseDown', beginStroke);
    controls.surface.events.elements.unhandle(
      'onElementsUnderCursorChange',
      extendStroke,
    );
    elements.unhandle('onMouseUp', endStroke);
    elements.unhandle('onClick', swallowClick);
  };

  const toggle = () => {
    if (engine.isActive()) deactivate();
    else activate();
  };

  const lifecycle = createLifecycle({
    // enabling only restores the ability to activate, the tools stay put away until asked
    onEnable: () => {},
    onDisable: deactivate,
  });

  lifecycle.enable();

  engine.events.subscribe('onAnnotationsChanged', captureSnapshot);

  return {
    name: 'annotations',
    transit: {
      encode: () => engine.annotations(),
      decode: (data) => engine.setAll(data),
      validate: (data) => true,
    },
    controls: {
      ...engine,
      activate,
      deactivate,
      toggle,
      theme,
      lifecycle,
    },
  };
};
