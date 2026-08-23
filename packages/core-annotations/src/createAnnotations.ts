import { circle } from '@canvas/primitives/shapes/circle/index';
import { scribble } from '@canvas/primitives/shapes/scribble/index';
import type { Coordinate } from '@canvas/primitives/types/utility';
import { createEventHub } from '@core/events/createEventHub';
import colors from '@core/utils/colors';
import type { Color } from '@core/utils/colors';
import { CURSOR } from '@core/utils/cursor';
import { generateId } from '@core/utils/id';
import { reactiveMap, signal } from '@reactive/primitives/index';

import {
  ANNOTATION_CURSOR_PRIORITY,
  ANNOTATION_PRIORITY,
  DEFAULT_BRUSH_WEIGHT,
  DEFAULT_COLOR,
  ERASER_BRUSH_RADIUS,
  ERASER_CURSOR_ID,
  ERASER_OUTLINE_WIDTH,
  ERASING_ALPHA,
  LASER_CURSOR_ID,
} from './constants.ts';
import { createAnnotationsEventRegistry } from './events.ts';
import { createStrokeInFlight } from './strokeInFlight.ts';
import type { StrokeInFlight } from './strokeInFlight.ts';
import type {
  Annotation,
  AnnotationCanvasElement,
  AnnotationMode,
  AnnotationsControls,
  CreateAnnotationsOptions,
  InFlightStroke,
} from './types.ts';

/**
 * the annotation tools, with no opinion on what they are drawn over. the host wires the
 * pointer into the stroke functions and paints {@link AnnotationsControls.canvasElements},
 * which is what lets the same engine sit behind the graph plugin and behind a product
 * that has nothing but a canvas surface.
 */
export const createAnnotations = ({
  surface,
  eraserOutlineColor = () => colors.GRAY_900,
}: CreateAnnotationsOptions): AnnotationsControls => {
  const events = createEventHub(createAnnotationsEventRegistry());

  const isActive = signal(false);
  const mode = signal<AnnotationMode>('drawing');
  const color = signal<Color>(DEFAULT_COLOR);
  const brushWeight = signal(DEFAULT_BRUSH_WEIGHT);

  // reactiveMap rather than Map: committed annotations are read through `annotations`,
  // which a plugin getter or a bridged ref sits on top of. insertion order is paint order
  const annotationsById = reactiveMap<string, Annotation>();

  // absent while erasing, which commits by taking annotations away rather than adding one
  let inFlight: StrokeInFlight | undefined;
  let isDrawing = false;
  const erasedIds = new Set<string>();

  const isErasing = () => mode() === 'erasing';
  const isLaserPointing = () => mode() === 'laser';

  const emitChange = (added: Annotation[], removedIds: string[]) => {
    if (added.length === 0 && removedIds.length === 0) return;
    events.emit('onAnnotationsChanged', { added, removedIds });
  };

  // an annotation never changes once committed, so an id already held is already identical
  const add = (toAdd: Annotation[]) => {
    const added = toAdd.filter(({ id }) => !annotationsById.has(id));
    for (const annotation of added) {
      annotationsById.set(annotation.id, annotation);
    }
    emitChange(added, []);
  };

  const remove = (ids: string[]) => {
    const removedIds: string[] = [];
    for (const id of ids) {
      if (annotationsById.delete(id)) removedIds.push(id);
    }
    emitChange([], removedIds);
  };

  const setAll = (next: Annotation[]) => {
    const nextIds = new Set(next.map(({ id }) => id));
    const removedIds = [...annotationsById.keys()].filter(
      (id) => !nextIds.has(id),
    );
    const added = next.filter(({ id }) => !annotationsById.has(id));

    annotationsById.clear();
    for (const annotation of next) {
      annotationsById.set(annotation.id, annotation);
    }

    emitChange(added, removedIds);
  };

  const clear = () => {
    const removedIds = [...annotationsById.keys()];
    annotationsById.clear();
    emitChange([], removedIds);
  };

  const markErased = (coords: Coordinate) => {
    const eraserBox = circle({
      at: coords,
      radius: ERASER_BRUSH_RADIUS,
    }).getBoundingBox();

    for (const annotation of annotationsById.values()) {
      if (scribble(annotation).overlapsBox(eraserBox)) {
        erasedIds.add(annotation.id);
      }
    }
  };

  const beginStroke = (coords: Coordinate) => {
    isDrawing = true;

    if (isErasing()) {
      markErased(coords);
      return;
    }

    // minted at the start of the stroke rather than at the end, so whoever is watching the
    // stroke can name the annotation it is going to become before it becomes one
    const stroke: InFlightStroke = {
      id: generateId(),
      mode: isLaserPointing() ? 'laser' : 'drawing',
      points: [coords],
      fillColor: color(),
      brushWeight: brushWeight(),
    };

    inFlight = createStrokeInFlight(stroke);
    events.emit('onStrokeBegan', stroke);
  };

  const extendStroke = (coords: Coordinate) => {
    if (!isDrawing) return;

    if (isErasing()) {
      markErased(coords);
      return;
    }

    inFlight?.extend([coords]);
    events.emit('onStrokeExtended', [coords]);
  };

  const endStroke = () => {
    if (!isDrawing) return;
    isDrawing = false;

    if (isErasing()) {
      const ids = [...erasedIds];
      erasedIds.clear();
      remove(ids);
      return;
    }

    const annotation = inFlight?.committed();
    inFlight = undefined;
    if (annotation) add([annotation]);

    events.emit('onStrokeEnded');
  };

  const abortStroke = () => {
    // announced even though nothing commits: a stroke abandoned mid flight is still a
    // stroke that stopped, and whoever was shown it has to be told to drop it
    const wasDrawingStroke = isDrawing && !isErasing();

    isDrawing = false;
    inFlight = undefined;
    erasedIds.clear();

    if (wasDrawingStroke) events.emit('onStrokeEnded');
  };

  const eraserCursorElement = (): AnnotationCanvasElement => ({
    id: ERASER_CURSOR_ID,
    priority: ANNOTATION_CURSOR_PRIORITY,
    shape: circle({
      at: surface.cursorCoordinates.value,
      radius: ERASER_BRUSH_RADIUS,
      fillColor: colors.TRANSPARENT,
      stroke: {
        color: eraserOutlineColor(),
        lineWidth: ERASER_OUTLINE_WIDTH,
      },
    }),
  });

  const laserCursorElement = (): AnnotationCanvasElement => ({
    id: LASER_CURSOR_ID,
    priority: ANNOTATION_CURSOR_PRIORITY,
    shape: circle({
      at: surface.cursorCoordinates.value,
      radius: brushWeight(),
      fillColor: color(),
    }),
  });

  const canvasElements = () => {
    const elements: AnnotationCanvasElement[] = [];

    for (const annotation of annotationsById.values()) {
      const isErased = erasedIds.has(annotation.id);
      elements.push({
        id: annotation.id,
        priority: ANNOTATION_PRIORITY,
        shape: scribble({
          ...annotation,
          fillColor: annotation.fillColor + (isErased ? ERASING_ALPHA : ''),
        }),
      });
    }

    // committed annotations are painted whether or not the tools have the pointer:
    // they outlive the session that drew them, and a peer's arrive without one
    if (!isActive()) return elements;

    if (isErasing()) {
      elements.push(eraserCursorElement());
      return elements;
    }

    // once per frame, since it is what prunes the laser trail
    const strokeElement = inFlight?.element();

    if (strokeElement) elements.push(strokeElement);
    else if (isLaserPointing()) elements.push(laserCursorElement());

    return elements;
  };

  // guarded so the events mark real transitions: `deactivate` in particular is called
  // on paths that cannot know whether the tools were ever taken out of standby
  const activate = () => {
    if (isActive()) return;
    isActive(true);
    events.emit('onActivated');
  };

  const deactivate = () => {
    if (!isActive()) return;
    abortStroke();
    mode('drawing');
    isActive(false);
    events.emit('onDeactivated');
  };

  const toggle = () => {
    if (isActive()) deactivate();
    else activate();
  };

  return {
    isActive: () => isActive(),
    mode: () => mode(),
    color: () => color(),
    brushWeight: () => brushWeight(),
    annotations: () => [...annotationsById.values()],
    cursor: () =>
      isErasing() || isLaserPointing() ? CURSOR.NONE : CURSOR.CROSSHAIR,

    setMode: (next) => mode(next),
    setColor: (next) => color(next),
    setBrushWeight: (next) => brushWeight(next),

    activate,
    deactivate,
    toggle,

    clear,
    add,
    remove,
    setAll,

    beginStroke,
    extendStroke,
    endStroke,

    canvasElements,

    events,
  };
};
