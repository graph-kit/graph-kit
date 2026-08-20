import type { ReadonlyEventHub } from '@core/events/createEventHub';

import type { CanvasBoundEvents } from './canvas.ts';
import type { DocumentBoundEvents } from './dom.ts';
import type { ElementEvents } from './elements.ts';
import type { CanvasLifecycleEvents } from './lifecycle.ts';

export type { CanvasBoundEvents } from './canvas.ts';
export type { DocumentBoundEvents } from './dom.ts';
export type {
  ElementEvents,
  ElementMouseEvent,
  ElementsUnderCursor,
} from './elements.ts';
export type { CanvasLifecycleEvents } from './lifecycle.ts';

export { createCanvasBoundEvents } from './canvas.ts';
export { createDocumentBoundEvents } from './dom.ts';
export { createElementsUnderCursor } from './elements.ts';
export { createCanvasLifecycleEventRegistry } from './lifecycle.ts';

export type SurfaceEvents = {
  /** native events bound to the canvas element */
  canvas: ReadonlyEventHub<CanvasBoundEvents>;
  /** native events bound to the document, for gestures that outlive the canvas */
  dom: ReadonlyEventHub<DocumentBoundEvents>;
  /** what the pointer is over, recomputed against the canvas as drawn */
  elements: ReadonlyEventHub<ElementEvents>;
  lifecycle: ReadonlyEventHub<CanvasLifecycleEvents>;
};
