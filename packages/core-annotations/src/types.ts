import type { ScribbleSchema } from '@canvas/primitives/shapes/scribble/types';
import type { Shape } from '@canvas/primitives/types/index';
import type { Coordinate } from '@canvas/primitives/types/utility';
import type { CanvasSurface } from '@canvas/surface/types';
import type { ReadonlyEventHub } from '@core/events/createEventHub';
import type { Color } from '@core/utils/colors';
import type { Cursor } from '@core/utils/cursor';

import type { ANNOTATION_MODES } from './constants.ts';
import type { AnnotationsEventMap } from './events.ts';

/**
 * a scribble drawn over whatever the host is rendering. immutable once committed: a
 * stroke is only ever added or removed, never edited in place
 */
export type Annotation = ScribbleSchema & { id: string };

export type AnnotationMode = (typeof ANNOTATION_MODES)[number];

/**
 * what a renderer needs to paint one annotation. structurally the graph aggregator's
 * canvas element, spelled out here so the engine stays clear of graph types
 */
export type AnnotationCanvasElement = {
  id: string;
  shape: Shape;
  priority: number;
  data?: Record<string, unknown>;
};

export type CreateAnnotationsOptions = {
  surface: CanvasSurface;
  /**
   * outline of the eraser ring, which has to contrast with whatever the host paints
   * beneath it and is therefore the host's to answer
   */
  eraserOutlineColor?: () => Color;
};

export type AnnotationsControls = {
  /** whether the annotation tools are taking input, see {@link AnnotationsControls.activate} */
  isActive: () => boolean;
  mode: () => AnnotationMode;
  color: () => Color;
  brushWeight: () => number;
  /** every committed annotation, in paint order */
  annotations: () => Annotation[];
  /** what the host should show the cursor as while the tools are active */
  cursor: () => Cursor;

  setMode: (mode: AnnotationMode) => void;
  setColor: (color: Color) => void;
  setBrushWeight: (brushWeight: number) => void;

  /**
   * takes the tools out of standby. wiring input and painting the cursor is the host's,
   * since only it knows what else is competing for the pointer
   */
  activate: () => void;
  /** drops any stroke in flight and returns the tools to standby */
  deactivate: () => void;
  toggle: () => void;

  clear: () => void;
  add: (annotations: Annotation[]) => void;
  remove: (ids: string[]) => void;
  /** makes `annotations` exactly this, which is what a decode or a remote write does */
  setAll: (annotations: Annotation[]) => void;

  /**
   * the stroke in flight, driven by whoever owns input. coordinates are the host's
   * world space, so annotations pan and zoom with everything else
   */
  beginStroke: (coords: Coordinate) => void;
  extendStroke: (coords: Coordinate) => void;
  endStroke: () => void;

  /** everything to paint this frame, committed annotations and tool cursor alike */
  canvasElements: () => AnnotationCanvasElement[];

  events: ReadonlyEventHub<AnnotationsEventMap>;
};
