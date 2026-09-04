import type { AggregatorControls } from '@canvas/primitives/aggregator/index';
import type {
  AnimatedShapeFactories,
  ShapeRenderer,
} from '@canvas/primitives/animation/index';
import type { BoundingBox, Coordinate } from '@core/utils/canvas/index';
import { DeepReadonly } from 'ts-essentials';

import type { ComputedRef, Ref } from 'vue';

import type { DrawPattern } from './backgroundPattern.ts';
import type { Camera } from './camera/index.ts';
import type { ElementsUnderCursor, SurfaceEvents } from './events/index.ts';

export type { BoundingBox, Coordinate };

export type DrawFns = {
  backgroundPattern: Ref<DrawPattern>;
  /** holds the canvas on its background pattern alone, leaving the aggregator undrawn */
  contentSuspended: Ref<boolean>;
  /** the mirror of {@link DrawFns.contentSuspended}, leaving the pattern undrawn */
  backgroundPatternSuspended: Ref<boolean>;
};

export type CanvasRef = {
  canvasRef: (canvas: HTMLCanvasElement) => void;
};

export type CanvasSurface = {
  canvas: Ref<HTMLCanvasElement | undefined>;
  camera: Camera;
  /**
   * where the cursor is; in world coordinates.
   */
  cursorCoordinates: ComputedRef<Coordinate | undefined>;
  /** where a mouse event landed in world coordinates, for hit tests against the event itself */
  toWorldCoordinates: (ev: MouseEvent) => Coordinate;
  /** the slice of the world on screen, for fills and clips that cover everything visible */
  visibleWorldRect: ComputedRef<BoundingBox>;
  ref: CanvasRef;
  draw: DrawFns;
  /** every canvas element this surface paints, and the hit test over them */
  aggregator: AggregatorControls;
  /**
   * build the shapes fed into the aggregator. these animate themselves, so a schema
   * change animates rather than snaps without any extra wiring.
   */
  shapes: AnimatedShapeFactories;
  /** the frame lifecycle and timelines behind `shapes` */
  renderer: ShapeRenderer;
  /** what the pointer is over right now, recomputed against the canvas as drawn */
  elementsUnderCursor: DeepReadonly<ElementsUnderCursor>;
  events: SurfaceEvents;
};
