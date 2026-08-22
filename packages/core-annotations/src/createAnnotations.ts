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
  ANNOTATION_IN_PROGRESS_PRIORITY,
  ANNOTATION_PRIORITY,
  DEFAULT_BRUSH_WEIGHT,
  DEFAULT_COLOR,
  ERASER_BRUSH_RADIUS,
  ERASER_CURSOR_ID,
  ERASER_OUTLINE_WIDTH,
  ERASING_ALPHA,
  IN_PROGRESS_ANNOTATION_ID,
  LASER_CURSOR_ID,
  LASER_FADE_MS,
  LASER_SEGMENT_LENGTH,
  LASER_TAPER_MIN_SCALE,
  LASER_TAPER_RUNS,
  LASER_TRAIL_ID,
  LASER_TRAIL_LENGTH,
  LASER_TRAIL_MAX_LENGTH,
  LASER_TRAIL_MS,
  LASER_TRIM_MS,
} from './constants.ts';
import { createAnnotationsEventRegistry } from './events.ts';
import type { TrailPoint } from './laserTrail.ts';
import {
  appendResampled,
  taperRuns,
  trimOlderThan,
  trimToLength,
} from './laserTrail.ts';
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

  // the stroke in flight, read only by the draw pass, which reruns every frame regardless
  let strokePoints: Coordinate[] = [];
  let isDrawing = false;
  // minted at the start of the stroke rather than at the end, so whoever is watching the
  // stroke can name the annotation it is going to become before it becomes one
  let strokeId = '';
  const erasedIds = new Set<string>();
  // the laser keeps its own points: they carry a timestamp, and unlike a stroke in flight
  // they are never committed to anything
  let laserTrail: TrailPoint[] = [];
  let laserDecayInterval: ReturnType<typeof setInterval> | undefined;
  let lastMoveTime = Date.now();

  const isErasing = () => mode() === 'erasing';
  const isLaserPointing = () => mode() === 'laser';

  // a stroke keeps the mode it began in: `setMode` is public, and a tool picked mid stroke
  // used to leave the laser committing its first point as an annotation and its decay
  // timer running for the life of the page
  let strokeMode: AnnotationMode = mode();
  const isErasingStroke = () => strokeMode === 'erasing';
  const isLaserStroke = () => strokeMode === 'laser';

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

  /**
   * while the pointer moves the trail holds a fixed span of motion, so its length is the
   * distance just covered. once it stalls the span collapses on a curve rather than at a
   * constant rate, which reads as the tail whipping after the cursor instead of a line
   * being wound in
   */
  const trailWindow = (now: number) => {
    const stalledFor = now - lastMoveTime;
    if (stalledFor <= 0) return LASER_TRAIL_MS;

    const fade = Math.min(1, stalledFor / LASER_FADE_MS);
    return LASER_TRAIL_MS * (1 - fade * fade);
  };

  const startDecayTimer = () => {
    if (laserDecayInterval) return;
    laserDecayInterval = setInterval(() => {
      const now = Date.now();
      trimOlderThan(laserTrail, now - trailWindow(now));
    }, LASER_TRIM_MS);
  };

  const stopDecayTimer = () => {
    if (!laserDecayInterval) return;
    clearInterval(laserDecayInterval);
    laserDecayInterval = undefined;
  };

  const inFlightStroke = (): InFlightStroke => ({
    id: strokeId,
    mode: isLaserStroke() ? 'laser' : 'drawing',
    points: [...strokePoints],
    fillColor: color(),
    brushWeight: brushWeight(),
  });

  const beginStroke = (coords: Coordinate) => {
    isDrawing = true;
    strokeMode = mode();
    strokeId = generateId();
    strokePoints = [coords];
    lastMoveTime = Date.now();

    if (isErasingStroke()) {
      markErased(coords);
      return;
    }

    if (isLaserStroke()) {
      laserTrail = [{ ...coords, at: lastMoveTime }];
      startDecayTimer();
    }

    events.emit('onStrokeBegan', inFlightStroke());
  };

  const extendStroke = (coords: Coordinate) => {
    if (!isDrawing) return;

    if (isErasingStroke()) {
      markErased(coords);
      return;
    }

    if (isLaserStroke()) {
      const now = Date.now();
      // jitter under the resample spacing plants nothing, and counting it as movement
      // would hold the fade off forever
      const moved = appendResampled(
        laserTrail,
        { ...coords, at: now },
        LASER_SEGMENT_LENGTH,
      );
      if (moved) lastMoveTime = now;
      trimToLength(laserTrail, LASER_TRAIL_MAX_LENGTH);
    } else {
      lastMoveTime = Date.now();
    }

    // what peers are sent is points and no timestamps, so their copy of a laser is held
    // by size and bled off against their own clock
    strokePoints.push(coords);
    if (isLaserStroke() && strokePoints.length > LASER_TRAIL_LENGTH) {
      strokePoints.shift();
    }

    events.emit('onStrokeExtended', [coords]);
  };

  const endStroke = () => {
    if (!isDrawing) return;
    isDrawing = false;
    stopDecayTimer();

    if (isErasingStroke()) {
      const ids = [...erasedIds];
      erasedIds.clear();
      remove(ids);
      return;
    }

    const points = strokePoints;
    const id = strokeId;
    strokePoints = [];

    // the laser leaves nothing behind, which is the whole point of it
    laserTrail = [];

    if (!isLaserStroke()) {
      add([
        {
          id,
          type: 'draw',
          points,
          fillColor: color(),
          brushWeight: brushWeight(),
        },
      ]);
    }

    events.emit('onStrokeEnded');
  };

  const abortStroke = () => {
    // announced even though nothing commits: a stroke abandoned mid flight is still a
    // stroke that stopped, and whoever was shown it has to be told to drop it
    const wasDrawingStroke = isDrawing && !isErasingStroke();

    isDrawing = false;
    strokePoints = [];
    laserTrail = [];
    erasedIds.clear();
    stopDecayTimer();

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

  // brush weight is the width of a stroke, so half of it is the radius that matches it:
  // the tip is the head of the trail, not a bead sitting on top of it
  const laserCursorElement = (): AnnotationCanvasElement => ({
    id: LASER_CURSOR_ID,
    priority: ANNOTATION_CURSOR_PRIORITY,
    shape: circle({
      at: surface.cursorCoordinates.value,
      radius: brushWeight() / 2,
      fillColor: color(),
    }),
  });

  /**
   * the trail is painted as a handful of runs at rising brush weights rather than one
   * stroke of one weight, so it thins out towards the tail the way a flick of light does
   */
  const laserTrailElements = (): AnnotationCanvasElement[] => {
    const runs = taperRuns(laserTrail, LASER_TAPER_RUNS);

    return runs.map((points, run) => {
      const towardsHead = (run + 1) / runs.length;
      const scale =
        LASER_TAPER_MIN_SCALE + (1 - LASER_TAPER_MIN_SCALE) * towardsHead;

      return {
        id: `${LASER_TRAIL_ID}-${run}`,
        priority: ANNOTATION_IN_PROGRESS_PRIORITY,
        shape: scribble({
          type: 'draw',
          points,
          fillColor: color(),
          brushWeight: Math.max(1, brushWeight() * scale),
        }),
      };
    });
  };

  const strokeInFlightElement = (): AnnotationCanvasElement => ({
    id: IN_PROGRESS_ANNOTATION_ID,
    priority: ANNOTATION_IN_PROGRESS_PRIORITY,
    shape: scribble({
      type: 'draw',
      points: strokePoints,
      fillColor: color(),
      brushWeight: brushWeight(),
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

    const isPlainStroke = !isErasingStroke() && !isLaserStroke();
    if (isDrawing && isPlainStroke && strokePoints.length > 0) {
      elements.push(strokeInFlightElement());
    }

    elements.push(...laserTrailElements());

    // the cursor follows the mode rather than the stroke: it is what the next stroke will
    // be, and the trail is resampled, so its head sits up to a segment behind the pointer
    // and the dot is what keeps the laser under the cursor while the trail catches up
    if (isErasing()) elements.push(eraserCursorElement());
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
