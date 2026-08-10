import { circle } from '@canvas/primitives/shapes/circle/index';
import { scribble as scribbleShape } from '@canvas/primitives/shapes/scribble/index';
import type { ScribbleSchema } from '@canvas/primitives/shapes/scribble/types';
import type { WithId } from '@canvas/primitives/types/index';
import type { Coordinate } from '@canvas/primitives/types/utility';
import colors from '@core/utils/colors';
import type { Color } from '@core/utils/colors';
import { generateId } from '@core/utils/id';
import { MOUSE_BUTTONS } from '@core/utils/mouse';
import { Aggregator } from '@graph/plugins/canvas/aggregator/types';
import { CanvasGraphMouseEvent } from '@graph/plugins/canvas/events';
import { GraphUnderCursor } from '@graph/plugins/canvas/types';
import { WithConsume } from '@graph/primitives/events/createEventHandler';
import { DeepReadonly } from 'ts-essentials';

import { computed, ref } from 'vue';

import { Graph } from '../../graph/types.ts';
import { AppearanceControls } from '../appearance/useProductAppearance.ts';
import {
  ANNOTATION_PLUGIN_ID,
  BRUSH_WEIGHTS,
  COLORS,
  ERASER_BRUSH_RADIUS,
  PRIORITY,
  THEME_TO_ERASER_OUTLINE,
} from './constants.ts';
import { createAnnotationThemer } from './createAnnotationThemer.ts';
import { useAnnotationHistory } from './history.ts';
import type { Annotation, AnnotationMode } from './types.ts';

export const useAnnotationsState = (
  canvas: Graph['canvas'],
  appearance: AppearanceControls,
) => {
  const selectedColor = ref<Color>(COLORS[0]);
  const selectedBrushWeight = ref(BRUSH_WEIGHTS[1]);
  const mode = ref<AnnotationMode>('drawing');
  const getMode = () => mode.value;
  const setMode = (next: AnnotationMode) => {
    mode.value = next;
  };
  const isErasing = computed(() => mode.value === 'erasing');
  const isLaserPointing = computed(() => mode.value === 'laser');
  const laserDecayInterval = ref<NodeJS.Timeout>();
  const lastMoveTime = ref(Date.now());
  const erasedScribbleIds = ref(new Set<string>());

  const batch = ref<Coordinate[]>([]);
  const scribbles = ref<Annotation[]>([]);
  const isDrawing = ref(false);
  const lastPoint = ref<Coordinate>();

  const isActive = ref(false);

  const history = useAnnotationHistory(scribbles);

  const clear = () => {
    if (scribbles.value.length === 0) return;

    history.addToUndoStack({
      action: 'remove',
      annotations: scribbles.value,
    });

    scribbles.value = [];
  };

  const startDecayTimer = () => {
    if (laserDecayInterval.value) return;

    laserDecayInterval.value = setInterval(() => {
      const inactivityTime = Date.now() - lastMoveTime.value;
      const shouldErase =
        inactivityTime > 50 && isLaserPointing.value && batch.value.length >= 2;
      if (shouldErase) batch.value.shift();
    }, 50);
  };

  /**
   * starts drawing from the current mouse position
   */
  const startDrawing = (
    { coords, event }: CanvasGraphMouseEvent,
    consume: () => void,
  ) => {
    if (event.button !== MOUSE_BUTTONS.left) return;
    consume();
    if (isErasing.value) {
      const eraserBoundingBox = circle({
        at: coords,
        radius: ERASER_BRUSH_RADIUS,
      }).getBoundingBox();

      const erasedScribbles = scribbles.value.filter((scribble) => {
        const shape = scribbleShape(scribble);
        return shape.overlapsBox(eraserBoundingBox);
      });

      for (const erasedScribble of erasedScribbles) {
        erasedScribbleIds.value.add(erasedScribble.id);
      }
    }

    isDrawing.value = true;
    lastPoint.value = coords;
    batch.value = [coords];
  };

  /**
   * draws a line that connects two points.
   * the delta between two mouse points while
   * mouse is being dragged
   */
  const drawLine = (
    { coords }: DeepReadonly<GraphUnderCursor>,
    consume: () => void,
  ) => {
    consume();
    if (!isDrawing.value || !lastPoint.value) return;
    if (batch.value.length === 0) return;
    if (isErasing.value) {
      const eraserBoundingBox = circle({
        at: coords,
        radius: ERASER_BRUSH_RADIUS,
      }).getBoundingBox();

      const erasedScribbles = scribbles.value.filter((scribble) => {
        const shape = scribbleShape(scribble);
        return shape.overlapsBox(eraserBoundingBox);
      });

      for (const erasedScribble of erasedScribbles) {
        erasedScribbleIds.value.add(erasedScribble.id);
      }
      return;
    }

    lastPoint.value = coords;
    batch.value.push(coords);

    if (isLaserPointing.value && batch.value.length > 10) {
      batch.value.shift();
    }

    if (isLaserPointing.value) {
      startDecayTimer();
    }

    lastMoveTime.value = Date.now();
  };

  const stopDrawing = (_: unknown, consume: () => void) => {
    if (!isDrawing.value) return;
    consume();
    isDrawing.value = false;
    lastPoint.value = undefined;

    if (isErasing.value) {
      const erasedScribbles = scribbles.value.filter((scribble) => {
        return erasedScribbleIds.value.has(scribble.id);
      });

      history.addToUndoStack({
        action: 'remove',
        annotations: erasedScribbles,
      });

      scribbles.value = scribbles.value.filter((scribble) => {
        return !erasedScribbleIds.value.has(scribble.id);
      });
      erasedScribbleIds.value.clear();
      return;
    }

    if (isLaserPointing.value) {
      laserDecayInterval.value = undefined;
      return;
    }

    const scribble = {
      id: generateId(),
      type: 'draw',
      points: batch.value,
      fillColor: selectedColor.value,
      brushWeight: selectedBrushWeight.value,
    } as const satisfies WithId<ScribbleSchema>;

    scribbles.value.push(scribble);

    history.addToUndoStack({
      action: 'add',
      annotations: [scribble],
    });

    batch.value = [];
  };

  const hideCursor = computed(() => isErasing.value || isLaserPointing.value);
  const cursorTheme = createAnnotationThemer(canvas, hideCursor);

  const addScribblesToAggregator = (aggregator: Aggregator) => {
    if (!isActive.value) return aggregator;

    if (isErasing.value) {
      const eraserId = 'annotation-eraser-cursor';
      const eraserCursor = circle({
        at: canvas.graphUnderCursor.coords,
        radius: ERASER_BRUSH_RADIUS,
        fillColor: colors.TRANSPARENT,
        stroke: {
          color: THEME_TO_ERASER_OUTLINE[appearance.state.value],
          lineWidth: 2,
        },
      });

      aggregator.push({
        id: eraserId,
        shape: eraserCursor,
        priority: 5050,
      });
    } else if (batch.value.length > 0 && isDrawing.value) {
      const incompleteScribble = scribbleShape({
        type: 'draw',
        points: batch.value,
        fillColor: selectedColor.value,
        brushWeight: selectedBrushWeight.value,
      });

      aggregator.push({
        id: 'annotation-incomplete',
        shape: incompleteScribble,
        priority: 5001,
      });
    } else if (isLaserPointing.value) {
      const laserPointerCursor = circle({
        at: canvas.graphUnderCursor.coords,
        radius: selectedBrushWeight.value,
        fillColor: selectedColor.value,
      });

      aggregator.push({
        id: 'laser-pointer-cursor',
        shape: laserPointerCursor,
        priority: 5050,
      });
    }

    for (const scribble of scribbles.value) {
      const isErased = erasedScribbleIds.value.has(scribble.id);
      aggregator.push({
        id: scribble.id,
        shape: scribbleShape({
          ...scribble,
          fillColor: scribble.fillColor + (isErased ? '50' : ''),
        }),
        priority: 5000,
      });
    }

    return aggregator;
  };

  canvas.aggregator.transformers.push(addScribblesToAggregator);

  const consume: WithConsume<(ev: CanvasGraphMouseEvent) => void> = (
    _,
    consumeFn,
  ) => consumeFn();

  const activate = () => {
    isActive.value = true;

    cursorTheme.activate();

    canvas.events.handle(
      'onMouseDown',
      startDrawing,
      ANNOTATION_PLUGIN_ID,
      PRIORITY,
    );
    canvas.events.handle(
      'onGraphUnderCursorChange',
      drawLine,
      ANNOTATION_PLUGIN_ID,
      PRIORITY,
    );
    canvas.events.handle(
      'onMouseUp',
      stopDrawing,
      ANNOTATION_PLUGIN_ID,
      PRIORITY,
    );
    canvas.events.handle('onClick', consume, ANNOTATION_PLUGIN_ID, PRIORITY);
  };

  const deactivate = () => {
    isActive.value = false;
    mode.value = 'drawing';

    cursorTheme.deactivate();

    canvas.events.unhandle('onMouseDown', startDrawing);
    canvas.events.unhandle('onGraphUnderCursorChange', drawLine);
    canvas.events.unhandle('onMouseUp', stopDrawing);
    canvas.events.unhandle('onClick', consume);
  };

  const load = (annotations: Annotation[]) => {
    scribbles.value = annotations;
  };

  return {
    clear: clear,
    isActive: isActive,

    annotations: scribbles,

    mode: getMode,
    setMode: setMode,
    color: selectedColor,
    brushWeight: selectedBrushWeight,

    activate: activate,
    deactivate: deactivate,

    load,

    history: {
      undo: history.undo,
      redo: history.redo,
      canUndo: history.canUndo,
      canRedo: history.canRedo,
    },
  };
};

export type AnnotationsControls = ReturnType<typeof useAnnotationsState>;
