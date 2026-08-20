import type { AggregatorControls } from '@canvas/primitives/aggregator/index';
import type {
  AnimatedShapeFactories,
  ShapeRenderer,
} from '@canvas/primitives/animation/index';
import { ReadonlyEventHub } from '@core/events/createEventHub';
import type { Coordinate, WorldRect } from '@core/utils/canvas/index';

import type { ComputedRef, Ref } from 'vue';

import type { DrawPattern } from './backgroundPattern.ts';
import type { Camera } from './camera/index.ts';
import { CanvasDOMEvents } from './domEvents.ts';
import { CanvasLifecycleEvents } from './events.ts';

export type { Coordinate, WorldRect };

export type DrawContent = (ctx: CanvasRenderingContext2D) => void;

export type DrawFns = {
  /**
   * @deprecated paint through {@link CanvasSurface.aggregator} instead. sets is the last
   * consumer, because its clip composed section fills have no primitive to express them
   * as canvas elements yet. this field goes the moment sets migrates.
   */
  content: Ref<DrawContent>;
  backgroundPattern: Ref<DrawPattern>;
  /** holds the canvas on its background pattern alone, leaving content undrawn */
  contentSuspended: Ref<boolean>;
};

export type CanvasRef = {
  canvasRef: (canvas: HTMLCanvasElement) => void;
  cleanup: (canvas: HTMLCanvasElement) => void;
};

export type CanvasSurface = {
  canvas: Ref<HTMLCanvasElement | undefined>;
  camera: Omit<Camera, 'cleanup'>;
  cursorCoordinates: Ref<Coordinate>;
  /** where a mouse event landed in world coordinates, for hit tests against the event itself */
  toWorldCoordinates: (ev: MouseEvent) => Coordinate;
  /** the slice of the world on screen, for fills and clips that cover everything visible */
  visibleWorldRect: ComputedRef<WorldRect>;
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
  lifecycleEvents: ReadonlyEventHub<CanvasLifecycleEvents>;
  events: ReadonlyEventHub<CanvasDOMEvents>;
};
