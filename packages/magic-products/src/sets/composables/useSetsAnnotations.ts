import type { Aggregator } from '@canvas/primitives/aggregator/types';
import type {
  ElementMouseEvent,
  ElementsUnderCursor,
} from '@canvas/surface/events/index';
import type { CanvasSurface } from '@canvas/surface/types';
import {
  type AnnotationsControls,
  createAnnotations,
} from '@core/annotations/index';
import { MOUSE_BUTTONS } from '@core/utils/mouse';
import type { DeepReadonly } from 'ts-essentials';

import { onBeforeUnmount } from 'vue';

import { ANNOTATION_HANDLER_PRIORITY, INPUT_HANDLER_ID } from '../constants.ts';
import type { SetsTheme } from '../theme/useSetsTheme.ts';

const ANNOTATION_THEME_LAYER_ID = 'sets/annotations';

type SetsAnnotationsProps = {
  surface: CanvasSurface;
  theme: SetsTheme;
};

/**
 * sets' implementation of the annotation tools, like `@graph/plugins/annotations`
 */
export const useSetsAnnotations = ({
  surface,
  theme,
}: SetsAnnotationsProps): AnnotationsControls => {
  const engine = createAnnotations({
    surface,
    eraserOutlineColor: () =>
      theme._resolveToken('annotations.eraser.outline.color'),
  });

  const cursorLayer = theme.createLayer(ANNOTATION_THEME_LAYER_ID);

  const beginStroke = (
    { coords, event }: ElementMouseEvent,
    consume: () => void,
  ) => {
    if (event.button !== MOUSE_BUTTONS.left) return;
    consume();
    engine.beginStroke(coords);
  };

  const extendStroke = (
    { coords }: DeepReadonly<ElementsUnderCursor>,
    consume: () => void,
  ) => {
    if (!coords) return;
    consume();
    engine.extendStroke(coords);
  };

  const endStroke = (_: unknown, consume: () => void) => {
    consume();
    engine.endStroke();
  };

  const swallow = (_: unknown, consume: () => void) => consume();

  const paintAnnotations = (aggregator: Aggregator) => {
    for (const element of engine.canvasElements()) {
      aggregator.push({ ...element, paintOnly: true });
    }
    return aggregator;
  };

  surface.aggregator.addTransformer(paintAnnotations);

  const activate = () => {
    engine.activate();

    cursorLayer.set('canvas.cursor', () => engine.cursor());

    const { elements } = surface.events;
    const id = INPUT_HANDLER_ID.annotations;
    const priority = ANNOTATION_HANDLER_PRIORITY;
    elements.handle('onMouseDown', beginStroke, id, priority);
    elements.handle('onElementsUnderCursorChange', extendStroke, id, priority);
    elements.handle('onMouseUp', endStroke, id, priority);
    elements.handle('onClick', swallow, id, priority);
    elements.handle('onDblClick', swallow, id, priority);
  };

  const deactivate = () => {
    engine.deactivate();

    cursorLayer.removeAll();

    const { elements } = surface.events;
    elements.unhandle('onMouseDown', beginStroke);
    elements.unhandle('onElementsUnderCursorChange', extendStroke);
    elements.unhandle('onMouseUp', endStroke);
    elements.unhandle('onClick', swallow);
    elements.unhandle('onDblClick', swallow);
  };

  onBeforeUnmount(() => {
    deactivate();
    surface.aggregator.removeTransformer(paintAnnotations);
  });

  return {
    ...engine,
    activate,
    deactivate,
    toggle: () => (engine.isActive() ? deactivate() : activate()),
  };
};
