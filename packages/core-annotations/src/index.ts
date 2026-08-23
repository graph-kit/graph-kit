export { createAnnotations } from './createAnnotations.ts';
export {
  ANNOTATION_IN_PROGRESS_PRIORITY,
  ANNOTATION_MODES,
  DEFAULT_BRUSH_WEIGHT,
  DEFAULT_COLOR,
  ERASER_BRUSH_RADIUS,
} from './constants.ts';
export type { AnnotationsChange, AnnotationsEventMap } from './events.ts';
export { laserTrail } from './laserTrail.ts';
export { createStrokeInFlight } from './strokeInFlight.ts';
export type { StrokeInFlight } from './strokeInFlight.ts';
export type {
  Annotation,
  AnnotationCanvasElement,
  AnnotationMode,
  AnnotationsControls,
  CreateAnnotationsOptions,
  InFlightStroke,
} from './types.ts';
